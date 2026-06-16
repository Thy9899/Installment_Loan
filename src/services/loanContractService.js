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
const jwt = require("jsonwebtoken");

/*
|--------------------------------------------------------------------------
| Generate Contract Number
|--------------------------------------------------------------------------
*/
const generateContractNo = () => {
  return `LC-${Date.now()}`;
};

/*
|--------------------------------------------------------------------------
| Create Loan Contract (MAIN FUNCTION WITH TRANSACTIONS)
|--------------------------------------------------------------------------
*/
const createLoanContract = async (data) => {
  let {
    customer_id,
    product_id,
    principal_amount,
    interest_rate,
    term_months,
    start_date,
    creatorId,
  } = data;

  // Force number formatting
  principal_amount = Number(principal_amount);
  interest_rate = Number(interest_rate);
  term_months = Number(term_months);

  // Validations
  if (isNaN(principal_amount) || isNaN(interest_rate) || isNaN(term_months)) {
    throw new Error("Invalid loan input (NaN detected)");
  }

  if (principal_amount <= 0 || term_months <= 0) {
    throw new Error("Invalid loan values");
  }

  /*
  |--------------------------------------------------------------------------
  | CALCULATIONS
  |--------------------------------------------------------------------------
  */
  const total_interest = (principal_amount * interest_rate * term_months) / 100;
  const total_amount = principal_amount + total_interest;
  const monthly_payment = total_amount / term_months;
  const remaining_balance = total_amount;
  const contract_no = generateContractNo();

  // CALCULATE EXPLICIT END DATE (Maturity Date)
  const baseDate = new Date(start_date);
  if (isNaN(baseDate.getTime())) {
    throw new Error("Invalid start_date format provided");
  }
  const endDateObj = new Date(baseDate);
  endDateObj.setMonth(endDateObj.getMonth() + term_months);
  const end_date = endDateObj.toISOString().split("T")[0];

  /*
  |--------------------------------------------------------------------------
  | DATABASE TRANSACTION ENFORCEMENT
  |--------------------------------------------------------------------------
  */
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert Loan Contract
    const [result] = await connection.query(
      `
      INSERT INTO loan_contracts
      (
        contract_no,
        customer_id,
        product_id,
        principal_amount,
        interest_rate,
        term_months,
        total_interest,
        total_amount,
        monthly_payment,
        remaining_balance,
        start_date,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        contract_no,
        customer_id,
        product_id,
        principal_amount,
        interest_rate,
        term_months,
        total_interest,
        total_amount,
        monthly_payment,
        remaining_balance,
        start_date,
        creatorId,
      ],
    );

    const contract_id = result.insertId;

    // Generate and Insert Schedules (Passing connection to keep the transaction alive)
    await generateSchedule(
      connection,
      contract_id,
      start_date,
      term_months,
      monthly_payment,
    );

    await connection.commit();

    return {
      contract_id,
      contract_no,
      principal_amount,
      total_interest,
      total_amount,
      monthly_payment,
      start_date,
      end_date, // Returned in data payload for UX clarity
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
| GENERATE INSTALLMENT SCHEDULE
|--------------------------------------------------------------------------
*/
const generateSchedule = async (
  connection,
  contract_id,
  start_date,
  term_months,
  monthly_payment,
) => {
  const schedules = [];

  for (let i = 1; i <= term_months; i++) {
    // FIX: Always create a completely fresh date from start_date inside the loop
    const dueDate = new Date(start_date);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedules.push([
      contract_id,
      i,
      dueDate.toISOString().split("T")[0],
      monthly_payment,
      0, // amount_paid
      "pending",
    ]);
  }

  await connection.query(
    `
    INSERT INTO payment_schedules
    (
      contract_id,
      installment_no,
      due_date,
      amount_due,
      amount_paid,
      status
    )
    VALUES ?
    `,
    [schedules],
  );
};

/*
|--------------------------------------------------------------------------
| GET ALL LOANS
|--------------------------------------------------------------------------
*/
const getLoans = async () => {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM loan_contracts
    ORDER BY id DESC
    `,
  );
  return rows;
};

/*
|--------------------------------------------------------------------------
| GET LOAN BY ID
|--------------------------------------------------------------------------
*/
const getLoanById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM loan_contracts
    WHERE id = ?
    `,
    [id],
  );

  if (!rows.length) {
    throw new Error("Loan not found");
  }

  return rows[0];
};

/*
|--------------------------------------------------------------------------
| GET INSTALLMENT SCHEDULE BY CONTRACT ID
|--------------------------------------------------------------------------
*/
// const getScheduleByContractId = async (contractId) => {
//   const [rows] = await pool.query(
//     `
//     SELECT
//       id,
//       installment_no,
//       due_date,
//       amount_due,
//       amount_paid,
//       status
//     FROM payment_schedules
//     WHERE contract_id = ?
//     ORDER BY installment_no ASC
//     `,
//     [contractId],
//   );

//   return rows;
// };

const getScheduleByContractId = async (contractId) => {
  const [contract] = await pool.query(
    `
    SELECT
      lc.*,
      c.full_name AS customer_name,
      c.phone
    FROM loan_contracts lc
    LEFT JOIN customers c
      ON lc.customer_id = c.id
    WHERE lc.id = ?
    `,
    [contractId],
  );

  const [schedules] = await pool.query(
    `
    SELECT
      id,
      installment_no,
      due_date,
      amount_due,
      amount_paid,
      status
    FROM payment_schedules
    WHERE contract_id = ?
    ORDER BY installment_no ASC
    `,
    [contractId],
  );

  return {
    contract: contract[0],
    schedules,
  };
};

module.exports = {
  createLoanContract,
  getLoans,
  getLoanById,
  getScheduleByContractId,
};
