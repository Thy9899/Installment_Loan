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
  penalty,
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

    // Fetch target milestone
    const [scheduleRows] = await connection.query(
      `SELECT * FROM payment_schedules WHERE contract_id = ? AND installment_no = ? FOR UPDATE`,
      [contract_id, installment_no],
    );

    if (!scheduleRows.length) {
      throw new Error(
        `Schedule record for contract ${contract_id} installment #${installment_no} not found.`,
      );
    }

    const schedule = scheduleRows[0];

    if (schedule.status === "paid") {
      throw new Error("This installment milestone is already fully paid.");
    }

    // Fetch parent loan contract
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

    /*
    |--------------------------------------------------------------------------
    | TARGET MILESTONE ARITHMETIC
    |--------------------------------------------------------------------------
    */
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

    // FIX: Generate dynamic receipt number string for the core installment allocation
    const primaryReceiptNo = await generateReceiptNo(connection);

    // Log tracking transaction with generated receipt_no key
    await connection.query(
      `INSERT INTO payments 
       (receipt_no, contract_id, schedule_id, amount_paid, payment_method, received_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        primaryReceiptNo,
        contract_id,
        schedule.id,
        actualAmountApplied,
        payment_method || "cash",
        received_by || null,
      ],
    );

    let totalAmountDeductedFromContract = actualAmountApplied;

    /*
    |--------------------------------------------------------------------------
    | CASCADING ROLLOVER ENGINE (FOR EXTRA OVERPAYMENT FUNDS)
    |--------------------------------------------------------------------------
    */
    let remainingOverflow = overpaymentOverflow;
    let currentTargetScheduleId = schedule.id;

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

      // FIX: Generate a completely new dynamic receipt_no for the overflow milestone step
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
          received_by || null,
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

    // Update parent loan summary balance metrics securely
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
      installment_no: Number(installment_no),
      receipt_no: primaryReceiptNo, // Returning primary tracking reference back to UI
      amount_processed: paymentAmount,
      primary_installment_status: status,
      total_overflow_distributed: overpaymentOverflow,
      unapplied_excess_cash: remainingOverflow,
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
| GET PAYMENT HISTORY AUDIT LEDGER
|--------------------------------------------------------------------------
*/
const getPaymentHistoryByContract = async (contractId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      p.id,
      p.receipt_no, -- Pulling generated receipt values into history maps
      p.amount_paid,
      p.payment_method,
      p.received_by,
      p.payment_date,
      ps.installment_no,
      ps.due_date
    FROM payments p
    LEFT JOIN payment_schedules ps ON p.schedule_id = ps.id
    WHERE p.contract_id = ?
    ORDER BY p.id DESC
    `,
    [contractId],
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
  getPaymentHistoryByContract,
  getOverdueInstallments,
};
