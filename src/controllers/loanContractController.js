/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Loan Contract Management
 * File        : loanContractController.js
 * Description : Handles loan contract creation and retrieval operations
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const loanService = require("../services/loanContractService");

/*
|--------------------------------------------------------------------------
| Create Loan Contract
|--------------------------------------------------------------------------
| Purpose:
| Creates a new loan contract for an existing customer.
|
| Business Process:
| 1. Validate customer eligibility
| 2. Validate selected loan product
| 3. Calculate loan terms
| 4. Generate contract number
| 5. Create loan contract
| 6. Generate repayment schedule
| 7. Store audit information
|
| Access:
| Admin
| Manager
| Loan Officer
|--------------------------------------------------------------------------
*/
const createLoan = async (req, res) => {
  try {
    /**
     * -------------------------------------------------------------
     * Retrieve Logged-In User ID
     * -------------------------------------------------------------
     * Used for:
     * - Audit Trail
     * - Loan Creation History
     * - User Accountability
     */
    const creatorId = req.user ? req.user.id : null;

    /**
     * -------------------------------------------------------------
     * Create Loan Contract
     * -------------------------------------------------------------
     * Pass loan data and creator information
     * to service layer.
     */
    const result = await loanService.createLoanContract({
      ...req.body,
      creatorId,
    });

    /**
     * -------------------------------------------------------------
     * Return Success Response
     * -------------------------------------------------------------
     */
    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: result,
    });
  } catch (error) {
    /**
     * -------------------------------------------------------------
     * Error Handling
     * -------------------------------------------------------------
     */
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Loan Contracts
|--------------------------------------------------------------------------
| Purpose:
| Retrieves all loan contracts in the system.
|
| Features:
| - Contract Listing
| - Customer Loan Tracking
| - Portfolio Monitoring
|
| Access:
| Authorized Staff
|--------------------------------------------------------------------------
*/
const getLoans = async (req, res) => {
  try {
    /**
     * Retrieve all contracts
     */
    const data = await loanService.getLoans();

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
| Get Loan Contract By ID
|--------------------------------------------------------------------------
| Purpose:
| Retrieves detailed loan contract information.
|
| Includes:
| - Customer Information
| - Loan Details
| - Financial Summary
| - Contract Status
|
| Parameters:
| - id (Contract ID)
|--------------------------------------------------------------------------
*/
const getLoanById = async (req, res) => {
  try {
    /**
     * Retrieve contract details
     */
    const data = await loanService.getLoanById(req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    /**
     * Contract not found
     */
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Loan Repayment Schedule
|--------------------------------------------------------------------------
| Purpose:
| Retrieves repayment schedule for a loan contract.
|
| Includes:
| - Installment Number
| - Due Date
| - Principal Amount
| - Interest Amount
| - Total Installment Amount
| - Payment Status
|
| Parameters:
| - id (Contract ID)
|--------------------------------------------------------------------------
*/
const getLoanSchedule = async (req, res) => {
  try {
    /**
     * Retrieve repayment schedule
     */
    const data = await loanService.getScheduleByContractId(req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    /**
     * Error retrieving schedule
     */
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLoan,
  getLoans,
  getLoanById,
  getLoanSchedule,
};
