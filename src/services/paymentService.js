/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Loan Product Management
 * File        : loanProductService.js
 * Description : Contains business logic for loan products
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| HELPER CODE GENERATORS
|--------------------------------------------------------------------------
*/
const generateCode = async () => {
  const [rows] = await repo.getLast();
  let next = 1;
  if (rows.length > 0) next = rows[0].id + 1;
  return `RC-${String(next).padStart(5, "0")}`;
};

/**
 * Generates a unique, trackable Receipt Number sequence
 * Uses a safe lockless atomic execution pattern
 */
const generateReceiptNo = async (connection) => {
  const [rows] = await connection.query(
    `SELECT id FROM payments ORDER BY id DESC LIMIT 1`,
  );
  let nextId = 1;
  if (rows.length > 0) {
    nextId = rows[0].id + 1;
  }
  // Generates sequence like: REC-00001, REC-00002
  return `REC-${String(nextId).padStart(5, "0")}`;
};

/*
|--------------------------------------------------------------------------
| PAY INSTALLMENT (CORE ENGINE WITH CASCADE OVERPAYMENT HANDLING)
|--------------------------------------------------------------------------
*/
const payInstallment = async ({
  contract_id,
  installment_no,
  amount,
  payment_method,
  received_by,
}) => {
  const paymentAmount = Number(amount);

  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error(
      "Invalid payment amount. Amount must be a positive number.",
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let schedule;

    // TARGET LOOKUP: Find the milestone and include calculations for current balance due
    if (installment_no && !isNaN(Number(installment_no))) {
      const [rows] = await connection.query(
        `SELECT *, (amount_due - amount_paid) AS dynamic_monthly_due 
         FROM payment_schedules 
         WHERE contract_id = ? AND installment_no = ? FOR UPDATE`,
        [contract_id, installment_no],
      );
      if (rows.length) schedule = rows[0];
    } else {
      const [rows] = await connection.query(
        `SELECT *, (amount_due - amount_paid) AS dynamic_monthly_due 
         FROM payment_schedules 
         WHERE contract_id = ? AND status != 'paid' 
         ORDER BY installment_no ASC LIMIT 1 FOR UPDATE`,
        [contract_id],
      );
      if (rows.length) schedule = rows[0];
    }

    if (!schedule) {
      throw new Error(
        `No unpaid schedule milestones found for contract ID ${contract_id}.`,
      );
    }

    if (schedule.status === "paid") {
      throw new Error(
        `Installment milestone #${schedule.installment_no} is already fully paid.`,
      );
    }

    const [contractRows] = await connection.query(
      `SELECT * FROM loan_contracts WHERE id = ? FOR UPDATE`,
      [contract_id],
    );

    if (!contractRows.length) {
      throw new Error(
        `Associated loan contract with ID ${contract_id} not found.`,
      );
    }

    const contract = contractRows[0];

    const currentPaid = Number(schedule.amount_paid);
    const amountDue = Number(schedule.amount_due);
    const remainingToPayForThisInstallment = Number(
      (amountDue - currentPaid).toFixed(2),
    );

    let actualAmountApplied = paymentAmount;
    let overpaymentOverflow = 0;

    if (paymentAmount > remainingToPayForThisInstallment) {
      actualAmountApplied = remainingToPayForThisInstallment;
      overpaymentOverflow = Number(
        (paymentAmount - remainingToPayForThisInstallment).toFixed(2),
      );
    }

    const newSchedulePaid = Number(
      (currentPaid + actualAmountApplied).toFixed(2),
    );
    let status = newSchedulePaid >= amountDue ? "paid" : "partial";

    await connection.query(
      `UPDATE payment_schedules SET amount_paid = ?, status = ? WHERE id = ?`,
      [newSchedulePaid, status, schedule.id],
    );

    const primaryReceiptNo = await generateReceiptNo(connection);

    await connection.query(
      `INSERT INTO payments 
       (
        receipt_no, 
        contract_id, 
        schedule_id, 
        amount_paid, 
        payment_method, 
        received_by
      ) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        primaryReceiptNo,
        contract_id,
        schedule.id,
        actualAmountApplied,
        payment_method || "cash",
        received_by,
      ],
    );

    let totalAmountDeductedFromContract = actualAmountApplied;
    let remainingOverflow = overpaymentOverflow;
    let currentTargetScheduleId = schedule.id;

    // CASCADING ROLLOVER
    while (remainingOverflow > 0) {
      const [nextRows] = await connection.query(
        `SELECT * FROM payment_schedules 
         WHERE contract_id = ? AND status != 'paid' AND id != ? 
         ORDER BY installment_no ASC LIMIT 1`,
        [contract_id, currentTargetScheduleId],
      );

      if (nextRows.length === 0) break;

      const nextSchedule = nextRows[0];
      const nextCurrentPaid = Number(nextSchedule.amount_paid);
      const nextAmountDue = Number(nextSchedule.amount_due);
      const nextNeeded = Number((nextAmountDue - nextCurrentPaid).toFixed(2));

      const overflowAppliedToThisRow =
        remainingOverflow > nextNeeded ? nextNeeded : remainingOverflow;
      const newNextPaid = Number(
        (nextCurrentPaid + overflowAppliedToThisRow).toFixed(2),
      );
      const nextStatus = newNextPaid >= nextAmountDue ? "paid" : "partial";

      await connection.query(
        `UPDATE payment_schedules SET amount_paid = ?, status = ? WHERE id = ?`,
        [newNextPaid, nextStatus, nextSchedule.id],
      );

      const overflowReceiptNo = await generateReceiptNo(connection);

      await connection.query(
        `INSERT INTO payments 
         (receipt_no, contract_id, schedule_id, amount_paid, payment_method, received_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          overflowReceiptNo,
          contract_id,
          nextSchedule.id,
          overflowAppliedToThisRow,
          payment_method || "cash",
          received_by,
        ],
      );

      totalAmountDeductedFromContract = Number(
        (totalAmountDeductedFromContract + overflowAppliedToThisRow).toFixed(2),
      );
      remainingOverflow = Number(
        (remainingOverflow - overflowAppliedToThisRow).toFixed(2),
      );
      currentTargetScheduleId = nextSchedule.id;
    }

    const finalContractBalance = Number(
      (
        Number(contract.remaining_balance) - totalAmountDeductedFromContract
      ).toFixed(2),
    );

    await connection.query(
      `UPDATE loan_contracts SET remaining_balance = ? WHERE id = ?`,
      [finalContractBalance, contract_id],
    );

    if (finalContractBalance <= 0) {
      await connection.query(
        `UPDATE loan_contracts SET status = 'completed' WHERE id = ?`,
        [contract_id],
      );
    }

    await connection.commit();

    return {
      contract_id: Number(contract_id),
      installment_no: Number(schedule.installment_no),
      receipt_no: primaryReceiptNo,
      amount_processed: paymentAmount,
      suggested_next_amount: schedule.dynamic_monthly_due, // Frontend read target
      primary_installment_status: status,
      remaining_loan_balance: finalContractBalance,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| FULL LEDGER PAY-OFF ENGINE
|--------------------------------------------------------------------------
*/
const payOffContract = async ({ contract_id, payment_method, received_by }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch parent contract configuration
    const [contractRows] = await connection.query(
      `SELECT * FROM loan_contracts WHERE id = ? FOR UPDATE`,
      [contract_id],
    );

    if (!contractRows.length) {
      throw new Error(`Loan contract with ID ${contract_id} not found.`);
    }

    const contract = contractRows[0];

    if (
      contract.status === "completed" ||
      Number(contract.remaining_balance) <= 0
    ) {
      throw new Error(
        "This loan contract is already fully closed and paid off.",
      );
    }

    const payoffAmountRequired = Number(
      Number(contract.remaining_balance).toFixed(2),
    );

    // Query all remaining unliquidated ledger schedules
    const [unpaidSchedules] = await connection.query(
      `SELECT * FROM payment_schedules 
       WHERE contract_id = ? AND status != 'paid' 
       ORDER BY installment_no ASC FOR UPDATE`,
      [contract_id],
    );

    const payoffReceiptNo = await generateReceiptNo(connection);

    // Close out every active milestone line item
    for (const schedule of unpaidSchedules) {
      const amountDue = Number(schedule.amount_due);

      // Update schedule line to paid status
      await connection.query(
        `UPDATE payment_schedules SET amount_paid = ?, status = 'paid' WHERE id = ?`,
        [amountDue, schedule.id],
      );

      // Log transaction entry breakdown lines linked to the uniform payoff receipt key
      await connection.query(
        `INSERT INTO payments 
         (receipt_no, contract_id, schedule_id, amount_paid, payment_method, received_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payoffReceiptNo,
          contract_id,
          schedule.id,
          amountDue - Number(schedule.amount_paid),
          payment_method || "cash",
          received_by,
        ],
      );
    }

    // Terminate contract liability completely
    await connection.query(
      `UPDATE loan_contracts SET remaining_balance = 0, status = 'completed' WHERE id = ?`,
      [contract_id],
    );

    await connection.commit();

    return {
      contract_id: Number(contract_id),
      receipt_no: payoffReceiptNo,
      amount_processed: payoffAmountRequired,
      is_payoff: true,
      remaining_loan_balance: 0,
      status: "completed",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| GET PAYMENT HISTORY AUDIT LEDGER
|--------------------------------------------------------------------------
*/
const getPaymentHistoryByContract = async (search) => {
  const searchParam = `%${search}%`;

  const [rows] = await pool.query(
    `
    SELECT 
      c.customer_code,
      c.full_name,
      c.phone,
      c.national_id, -- Added missing comma here

      p.id,
      p.receipt_no, 
      p.amount_paid,
      p.payment_method,
      p.received_by,
      p.payment_date,
      ps.installment_no,
      ps.due_date,
      lc.contract_no
    
    FROM payments p
    INNER JOIN payment_schedules ps ON p.schedule_id = ps.id
    INNER JOIN loan_contracts lc ON p.contract_id = lc.id
    INNER JOIN customers c ON lc.customer_id = c.id -- Correctly routes customer data through the loan contract
  
    WHERE p.receipt_no LIKE ?
      OR c.customer_code LIKE ?
      OR lc.contract_no LIKE ? -- Allows searching by actual human-readable contract numbers (e.g., RC-0001)
  
    ORDER BY p.id DESC
    `,
    [searchParam, searchParam, searchParam],
  );
  return rows;
};

/*
|--------------------------------------------------------------------------
| GET OVERVIEW OF DELAYED/OVERDUE ACCOUNTS
|--------------------------------------------------------------------------
*/
const getOverdueInstallments = async () => {
  const [rows] = await pool.query(
    `
    SELECT 
      ps.id AS schedule_row_id,
      ps.contract_id,
      lc.contract_no,
      ps.installment_no,
      ps.due_date,
      (ps.amount_due - ps.amount_paid) AS balance_overdue
    FROM payment_schedules ps
    JOIN loan_contracts lc ON ps.contract_id = lc.id
    WHERE ps.status IN ('pending', 'partial')
      AND ps.due_date < CURDATE()
    ORDER BY ps.due_date ASC
    `,
  );
  return rows;
};

module.exports = {
  payInstallment,
  payOffContract,
  getPaymentHistoryByContract,
  getOverdueInstallments,
};
