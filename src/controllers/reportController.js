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

const reportService = require("../services/reportService");

/*
|--------------------------------------------------------------------------
| Loan Portfolio Report
|--------------------------------------------------------------------------
| Purpose:
| Displays overall loan portfolio summary.
|
| Includes:
| - Total active loans
| - Total disbursed amount
| - Total outstanding balance
|--------------------------------------------------------------------------
*/
const getLoanPortfolio = async (req, res) => {
  try {
    const data = await reportService.getLoanPortfolio();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Daily Collection Report
|--------------------------------------------------------------------------
| Purpose:
| Shows all payments collected on a specific date.
|
| Default:
| - If no date provided → uses current system date
|
| KPIs:
| - Total transactions
| - Total amount collected
|--------------------------------------------------------------------------
*/
const getDailyCollection = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const data = await reportService.getDailyCollection(date);

    const totalAmount = data.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    res.json({
      success: true,
      totalPayments: data.length,
      totalAmount,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Overdue Loans Report
|--------------------------------------------------------------------------
| Purpose:
| Lists all loans with overdue payments.
|
| Used For:
| - Credit Risk Monitoring
| - Debt Collection
| - COB Processing
|--------------------------------------------------------------------------
*/
const getOverdueLoans = async (req, res) => {
  try {
    const data = await reportService.getOverdueLoans();

    const totalOverdueAmount = data.reduce(
      (sum, row) => sum + Number(row.amount_due),
      0,
    );

    res.json({
      success: true,
      totalAccounts: data.length,
      totalOverdueAmount,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Customer Loan Statement
|--------------------------------------------------------------------------
| Purpose:
| Displays full repayment history for a single loan contract.
|
| Includes:
| - Installment history
| - Payment dates
| - Outstanding balance changes
|--------------------------------------------------------------------------
*/
const getCustomerStatement = async (req, res) => {
  try {
    const data = await reportService.getCustomerStatement(
      req.params.contractId,
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Outstanding Balance Report
|--------------------------------------------------------------------------
| Purpose:
| Shows total unpaid loan balances across all contracts.
|
| KPIs:
| - Total outstanding amount
| - Number of active loans
|--------------------------------------------------------------------------
*/
const getOutstandingBalances = async (req, res) => {
  try {
    const data = await reportService.getOutstandingBalances();

    const totalOutstanding = data.reduce(
      (sum, row) => sum + Number(row.remaining_balance),
      0,
    );

    const totalLoans = data.length;

    res.json({
      success: true,
      totalLoans,
      totalOutstanding,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getLoanPortfolio,
  getDailyCollection,
  getOverdueLoans,
  getCustomerStatement,
  getOutstandingBalances,
};
