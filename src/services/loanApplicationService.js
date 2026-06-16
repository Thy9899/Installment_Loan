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
| HELPER CODE GENERATORS (Synced with Customer & Loan Services)
|--------------------------------------------------------------------------
*/
const generateCustomerCode = async (connection) => {
  // Queries your database system safely inside the active pool transaction lock
  const [rows] = await connection.query(
    `SELECT id FROM customers ORDER BY id DESC LIMIT 1`,
  );
  let next = 1;
  if (rows.length > 0) next = rows[0].id + 1;
  return `CUS${String(next).padStart(5, "0")}`;
};

const generateContractNo = () => {
  return `LC-${Date.now()}`;
};

/*
|--------------------------------------------------------------------------
| CREATE UNIFIED APPLICATION TRANSACTION ENGINE
|--------------------------------------------------------------------------
*/
const createUnifiedApplication = async (body) => {
  const {
    // Customer Profile Fields
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    national_id,
    occupation,
    address,
    // Loan Contract Details
    product_id,
    principal_amount,
    interest_rate,
    term_months,
    start_date,
    creatorId,
  } = body;

  // Core Structural Validation Check
  if (
    !full_name ||
    !gender ||
    !date_of_birth ||
    !phone ||
    !email ||
    !product_id ||
    !principal_amount ||
    !term_months ||
    !interest_rate
  ) {
    throw new Error("Missing critical customer or loan contract fields.");
  }

  // Parse numerical types to prevent string concatenation math errors
  const parsedPrincipal = Number(principal_amount);
  const parsedInterestRate = Number(interest_rate);
  const parsedTermMonths = Number(term_months);

  if (parsedPrincipal <= 0 || parsedTermMonths <= 0) {
    throw new Error(
      "Invalid financial entries: Principal and Terms must be greater than zero.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINANCIAL ARITHMETIC CALCULATIONS 
  |--------------------------------------------------------------------------
  */
  const total_interest = Number(
    ((parsedPrincipal * parsedInterestRate * parsedTermMonths) / 100).toFixed(
      2,
    ),
  );
  const total_amount = Number((parsedPrincipal + total_interest).toFixed(2));
  const monthly_payment = Number((total_amount / parsedTermMonths).toFixed(2));
  const remaining_balance = total_amount;

  const contract_no = generateContractNo();

  const baseDate = new Date(start_date || new Date());
  const endDateObj = new Date(baseDate);
  endDateObj.setMonth(endDateObj.getMonth() + parsedTermMonths);
  const end_date = endDateObj.toISOString().split("T")[0];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | STEP Process and Create Customer Record
    |--------------------------------------------------------------------------
    */
    // Dynamically calculate the custom code sequence
    const customer_code = await generateCustomerCode(connection);

    // Corrected position array balancing placeholders 1:1 matching elements
    const [customerResult] = await connection.query(
      `INSERT INTO customers 
       (
          customer_code, 
          full_name, gender, 
          date_of_birth, 
          phone, 
          email, 
          national_id, 
          occupation, 
          address,
          created_by
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_code,
        full_name,
        gender,
        date_of_birth,
        phone,
        email,
        national_id || null,
        occupation || null,
        address || null,
        creatorId,
      ],
    );

    const newCustomerId = customerResult.insertId;

    /*
    |--------------------------------------------------------------------------
    | STEP Process and Create Loan Contract Record
    |--------------------------------------------------------------------------
    */
    const [loanResult] = await connection.query(
      `INSERT INTO loan_contracts
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
         end_date,
         status,
         created_by
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contract_no,
        newCustomerId,
        product_id,
        parsedPrincipal,
        parsedInterestRate,
        parsedTermMonths,
        total_interest,
        total_amount,
        monthly_payment,
        remaining_balance,
        start_date || new Date().toISOString().split("T")[0],
        end_date,
        "active",
        creatorId,
      ],
    );

    const newContractId = loanResult.insertId;

    /*
    |--------------------------------------------------------------------------
    | STEP Auto-Generate Clean Bulk Installment Payment Schedules
    |--------------------------------------------------------------------------
    */
    const schedules = [];
    const targetStartDate =
      start_date || new Date().toISOString().split("T")[0];

    for (let i = 1; i <= parsedTermMonths; i++) {
      const dueDate = new Date(targetStartDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedules.push([
        newContractId,
        i,
        dueDate.toISOString().split("T")[0],
        monthly_payment,
        0.0, // amount_paid initialized to zero
        "pending",
      ]);
    }

    // Execute high performance bulk array structural insert
    await connection.query(
      `INSERT INTO payment_schedules
       (contract_id, installment_no, due_date, amount_due, amount_paid, status)
       VALUES ?`,
      [schedules],
    );

    await connection.commit();

    return {
      customer_id: newCustomerId,
      customer_code: customer_code,
      contract_id: newContractId,
      contract_no: contract_no,
      customer_name: full_name,
      principal_amount: parsedPrincipal,
      total_interest: total_interest,
      total_amount_due: total_amount,
      monthly_installment_payment: monthly_payment,
      start_date: targetStartDate,
      maturity_end_date: end_date,
      total_installments_generated: parsedTermMonths,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createUnifiedApplication,
};
