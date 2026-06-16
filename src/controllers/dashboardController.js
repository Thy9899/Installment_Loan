/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Dashboard
 * File        : dashboardController.js
 * Description : Provides dashboard KPIs and summary statistics
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| Dashboard Summary
|--------------------------------------------------------------------------
| Purpose:
| Retrieves key performance indicators (KPIs) for the dashboard.
|
| Dashboard Metrics:
| - Total Customers
| - Active Loan Contracts
| - Total Loan Amount Issued
| - Remaining Loan Balance
| - Collected Payments Today
| - Outstanding Balance
| - Overdue Installments
|
| Access:
| Admin, Manager
|--------------------------------------------------------------------------
*/
const getDashboard = async (req, res) => {
  try {
    /**
     * -------------------------------------------------------------
     * Total Registered Customers
     * -------------------------------------------------------------
     * Counts all customers in the system.
     */
    const [customers] = await pool.query(
      "SELECT COUNT(*) AS total FROM customers",
    );

    /**
     * -------------------------------------------------------------
     * Active Loan Contracts
     * -------------------------------------------------------------
     * Counts currently active loan contracts.
     */
    const [activeLoans] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM loan_contracts
      WHERE status = 'active'
    `);

    /**
     * -------------------------------------------------------------
     * Total Loan Amount Issued
     * -------------------------------------------------------------
     * Calculates total loan amount issued to customers.
     */
    const [totalAmount] = await pool.query(`
      SELECT SUM(total_amount) AS total_amount
      FROM loan_contracts
    `);

    /**
     * -------------------------------------------------------------
     * Remaining Loan Balance
     * -------------------------------------------------------------
     * Calculates outstanding balance across all contracts.
     */
    const [remainingBalance] = await pool.query(`
      SELECT SUM(remaining_balance) AS remaining_balance
      FROM loan_contracts
    `);

    /**
     * -------------------------------------------------------------
     * Today's Collection
     * -------------------------------------------------------------
     * Calculates total payments received today.
     */
    const [collectedToday] = await pool.query(`
      SELECT SUM(amount_paid) AS total
      FROM payments
      WHERE DATE(payment_date) = CURDATE()
    `);

    /**
     * -------------------------------------------------------------
     * Outstanding Balance
     * -------------------------------------------------------------
     * Total unpaid balance across all contracts.
     */
    const [outstanding] = await pool.query(`
      SELECT SUM(remaining_balance) AS total
      FROM loan_contracts
    `);

    /**
     * -------------------------------------------------------------
     * Overdue Installments
     * -------------------------------------------------------------
     * Counts installments that have passed their due date
     * and remain unpaid.
     */
    const [overdue] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM payment_schedules
      WHERE status = 'overdue'
    `);

    /**
     * -------------------------------------------------------------
     * Return Dashboard Response
     * -------------------------------------------------------------
     */
    res.json({
      success: true,
      data: {
        totalCustomers: customers[0].total,
        activeLoans: activeLoans[0].total,
        totalAmount: totalAmount[0].total_amount || 0,
        remainingBalance: remainingBalance[0].remaining_balance || 0,
        collectedToday: collectedToday[0].total || 0,
        outstanding: outstanding[0].total || 0,
        overdueAccounts: overdue[0].total,
      },
    });
  } catch (error) {
    /**
     * -------------------------------------------------------------
     * Error Handling
     * -------------------------------------------------------------
     * Returns server error if KPI retrieval fails.
     */
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};
