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
| Loan Portfolio Report
|--------------------------------------------------------------------------
| Purpose:
| Retrieves full list of active loan contracts with customer and product details.
|
| Business Use:
| - Portfolio analysis
| - Risk monitoring
| - Management reporting
|--------------------------------------------------------------------------
*/
const getLoanPortfolio = async () => {
  const [rows] = await pool.query(`
    SELECT
      lc.id,
      lc.contract_no,
      c.customer_code,
      c.full_name,
      lp.product_name,
      lc.principal_amount,
      lc.total_interest,
      lc.total_amount,
      lc.remaining_balance,
      lc.status,
      lc.start_date
    FROM loan_contracts lc
    INNER JOIN customers c
      ON lc.customer_id = c.id
    INNER JOIN loan_products lp
      ON lc.product_id = lp.id
    ORDER BY lc.id DESC
  `);

  return rows;
};

/*
|--------------------------------------------------------------------------
| Daily Collection Report
|--------------------------------------------------------------------------
| Purpose:
| Retrieves all payments made on a specific business date.
|
| Used For:
| - Cashier reconciliation
| - Daily financial reporting
| - COB verification
|--------------------------------------------------------------------------
*/
const getDailyCollection = async (businessDate) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.receipt_no,
      c.full_name,
      lc.contract_no,
      p.amount_paid,
      p.payment_date
    FROM payments p
    INNER JOIN loan_contracts lc
      ON p.contract_id = lc.id
    INNER JOIN customers c
      ON lc.customer_id = c.id
    WHERE DATE(p.payment_date) = ?
    ORDER BY p.payment_date DESC
    `,
    [businessDate],
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| Overdue Loans Report
|--------------------------------------------------------------------------
| Purpose:
| Retrieves all overdue and at-risk installment schedules.
|
| Risk Indicators:
| - Days overdue
| - Pending or partial payments
| - Missed due dates
|
| Used By:
| - Collection team
| - Risk department
| - COB process
|--------------------------------------------------------------------------
*/
const getOverdueLoans = async () => {
  const [rows] = await pool.query(`
    SELECT
      ps.id,
      lc.contract_no,
      c.customer_code,
      c.full_name,
      c.phone,

      ps.installment_no,
      ps.due_date,
      ps.amount_due,

      DATEDIFF(CURDATE(), ps.due_date)
      AS days_overdue

    FROM payment_schedules ps

    INNER JOIN loan_contracts lc
      ON ps.contract_id = lc.id

    INNER JOIN customers c
      ON lc.customer_id = c.id

    WHERE
      ps.status IN ('pending','partial','overdue')
      AND ps.due_date < CURDATE()

    ORDER BY days_overdue DESC
  `);

  return rows;
};

/*
|--------------------------------------------------------------------------
| Customer Loan Statement
|--------------------------------------------------------------------------
| Purpose:
| Provides full loan account statement for a single contract.
|
| Includes:
| - Loan summary
| - Payment history
| - Installment schedule
|--------------------------------------------------------------------------
*/
const getCustomerStatement = async (search) => {
  // Prepare the search term for the LIKE clauses
  const searchParam = `%${search}%`;

  // Fetch the loan information first
  const [loanRows] = await pool.query(
    `
    SELECT
      lc.id,
      lc.contract_no,

      c.customer_code,
      c.full_name,
      c.phone,

      lp.product_name,

      lc.principal_amount,
      lc.total_interest,
      lc.total_amount,
      lc.remaining_balance

    FROM loan_contracts lc

    INNER JOIN customers c
      ON lc.customer_id = c.id

    INNER JOIN loan_products lp
      ON lc.product_id = lp.id

    WHERE lc.id LIKE ?
      OR lc.contract_no LIKE ?
      OR c.full_name LIKE ?
    LIMIT 1
    `,
    [searchParam, searchParam, searchParam],
  );

  const loanInfo = loanRows[0];

  // Guard clause: If no loan matches the search, return early
  if (!loanInfo) {
    return {
      loanInfo: null,
      payments: [],
      schedules: [],
    };
  }

  // 4. Use the concrete loan ID to fetch related payments and schedules parallelly
  const [paymentsPromise, schedulesPromise] = [
    pool.query(
      ` 
      SELECT 
        receipt_no, 
        amount_paid, 
        payment_date

      FROM payments

      WHERE contract_id = ?

      ORDER BY payment_date ASC
      `,
      [loanInfo.id],
    ),
    pool.query(
      `
      SELECT 
        installment_no, 
        due_date, 
        amount_due, 
        amount_paid, 
        status
      
      FROM payment_schedules
      
      WHERE contract_id = ?
      
      ORDER BY installment_no ASC
      `,
      [loanInfo.id],
    ),
  ];

  const [[payments], [schedules]] = await Promise.all([
    paymentsPromise,
    schedulesPromise,
  ]);

  return {
    loanInfo,
    payments,
    schedules,
  };
};

/*
|--------------------------------------------------------------------------
| Outstanding Balance Report
|--------------------------------------------------------------------------
| Purpose:
| Shows all active loans with remaining balances.
|
| Business Use:
| - Portfolio risk exposure
| - Liquidity analysis
| - Financial reporting
|--------------------------------------------------------------------------
*/
const getOutstandingBalances = async () => {
  const [rows] = await pool.query(`
    SELECT
      lc.id,
      lc.contract_no,

      c.customer_code,
      c.full_name,
      c.phone,

      lp.product_name,

      lc.principal_amount,
      lc.total_amount,
      lc.remaining_balance,

      lc.status

    FROM loan_contracts lc

    INNER JOIN customers c
      ON lc.customer_id = c.id

    INNER JOIN loan_products lp
      ON lc.product_id = lp.id

    WHERE lc.status = 'active'

    ORDER BY lc.remaining_balance DESC
  `);

  return rows;
};

module.exports = {
  getLoanPortfolio,
  getDailyCollection,
  getOverdueLoans,
  getCustomerStatement,
  getOutstandingBalances,
};
