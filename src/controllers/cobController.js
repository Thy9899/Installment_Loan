/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Close of Business (COB)
 * File        : cobController.js
 * Description : Handles Close of Business operations and system date retrieval
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const cobService = require("../services/cobService");

/*
|--------------------------------------------------------------------------
| Run Close of Business (COB)
|--------------------------------------------------------------------------
| Purpose:
| Executes the End-of-Day business process.
|
| Business Functions:
| - Process overdue installments
| - Apply penalties and late fees
| - Update payment schedule statuses
| - Advance business date
| - Record COB execution history
|
| Access:
| Admin
| Manager
|
| Audit:
| Saves the user ID that executed the COB process.
|--------------------------------------------------------------------------
*/
const runCOB = async (req, res) => {
  try {
    /**
     * -------------------------------------------------------------
     * Retrieve Logged-In User ID
     * -------------------------------------------------------------
     * Used for audit trail and COB history logging.
     */
    const adminId = req.user ? req.user.id : null;

    /**
     * -------------------------------------------------------------
     * Execute COB Process
     * -------------------------------------------------------------
     * Pass execution user information to service layer.
     */
    const result = await cobService.runCOB({
      ...req.body,
      run_by: adminId,
    });

    /**
     * -------------------------------------------------------------
     * Return COB Execution Result
     * -------------------------------------------------------------
     */
    res.json(result);
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
| Get Current System Business Date
|--------------------------------------------------------------------------
| Purpose:
| Retrieves the current business date used by the system.
|
| Difference:
| Business Date ≠ Server Date
|
| Example:
| Server Date   : 2026-07-01
| Business Date : 2026-06-30
|
| Used By:
| - Dashboard
| - Payment Processing
| - COB Module
| - Loan Calculations
|--------------------------------------------------------------------------
*/
const getSystemDate = async (req, res) => {
  try {
    /**
     * -------------------------------------------------------------
     * Retrieve Current Business Date
     * -------------------------------------------------------------
     */
    const businessDate = await cobService.getSystemDate();

    /**
     * -------------------------------------------------------------
     * Return Business Date Information
     * -------------------------------------------------------------
     */
    res.status(200).json({
      success: true,
      message: "Business date retrieved successfully",

      data: {
        /**
         * Current operational business date
         */
        businessDate,

        /**
         * Current COB state
         * OPEN   = Transactions allowed
         * CLOSED = Awaiting next business day
         */
        cobStatus: "OPEN",

        /**
         * Actual server timestamp
         */
        serverTime: new Date(),
      },
    });
  } catch (error) {
    /**
     * -------------------------------------------------------------
     * Log Error
     * -------------------------------------------------------------
     */
    console.error("Get System Date Error:", error);

    /**
     * -------------------------------------------------------------
     * Return Error Response
     * -------------------------------------------------------------
     */
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  runCOB,
  getSystemDate,
};
