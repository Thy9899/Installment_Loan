/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Loan Application Management
 * File        : loanApplicationController.js
 * Description : Handles loan application submission and processing
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const applicationService = require("../services/loanApplicationService");

/*
|--------------------------------------------------------------------------
| Submit Loan Application
|--------------------------------------------------------------------------
| Purpose:
| Creates a complete loan application in a single transaction.
|
| Business Process:
| 1. Create Customer Profile
| 2. Create Loan Contract
| 3. Generate Installment Schedule
| 4. Link Customer and Contract
| 5. Record Creator Information
|
| Transaction Safety:
| All operations must succeed together.
| If any step fails, the transaction is rolled back.
|
| Access:
| Admin
| Manager
| Loan Officer
|--------------------------------------------------------------------------
*/
const submitApplication = async (req, res) => {
  try {
    /**
     * -------------------------------------------------------------
     * Retrieve Authenticated User ID
     * -------------------------------------------------------------
     * Used for:
     * - Audit Trail
     * - Record Ownership
     * - Application Tracking
     */
    const creatorId = req.user ? req.user.id : null;

    /**
     * -------------------------------------------------------------
     * Submit Unified Application
     * -------------------------------------------------------------
     * Creates customer, loan contract, and repayment
     * schedule within a single business transaction.
     */
    const result = await applicationService.createUnifiedApplication({
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

      message:
        "Customer profile and loan contract created successfully together.",

      data: result,
    });
  } catch (error) {
    /**
     * -------------------------------------------------------------
     * Business Validation Error
     * -------------------------------------------------------------
     * Examples:
     * - Invalid loan amount
     * - Product not found
     * - Customer validation failure
     * - Schedule generation failure
     */
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitApplication,
};
