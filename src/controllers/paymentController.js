/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Payment / Installment Processing
 * File        : paymentController.js
 * Description : Handles installment payments, history, and overdue tracking
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const paymentService = require("../services/paymentService");

/*
|--------------------------------------------------------------------------
| Process Installment Payment
|--------------------------------------------------------------------------
| Purpose:
| Processes a customer installment payment for a loan contract.
|
| Business Flow:
| 1. Validate contract & installment
| 2. Calculate remaining balance
| 3. Update payment schedule
| 4. Record payment transaction
| 5. Update loan contract status
| 6. Store cashier/staff information
|
| Access:
| Admin
| Cashier
| Loan Officer
|
| Financial Impact:
| Reduces outstanding loan balance
|--------------------------------------------------------------------------
*/
const pay = async (req, res) => {
  try {
    const staffId = req.user ? req.user.id : null;

    // Routing Logic split based on whether a 'is_payoff' flag is passed in the request body
    let result;
    if (req.body.is_payoff === true) {
      result = await paymentService.payOffContract({
        contract_id: req.body.contract_id,
        payment_method: req.body.payment_method,
        received_by: staffId,
      });
    } else {
      result = await paymentService.payInstallment({
        ...req.body,
        received_by: staffId,
      });
    }

    res.json({
      success: true,
      message: req.body.is_payoff
        ? "Contract fully paid off successfully"
        : "Payment processed successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Payment History By Contract
|--------------------------------------------------------------------------
| Purpose:
| Retrieves full payment history for a loan contract.
|
| Includes:
| - Installment payments
| - Payment dates
| - Amount paid
| - Remaining balance updates
|--------------------------------------------------------------------------
*/
const getHistory = async (req, res) => {
  try {
    /**
     * Extract contract ID from request parameters
     */
    const { search } = req.params;

    /**
     * Retrieve payment history
     */
    const data = await paymentService.getPaymentHistoryByContract(search);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    /**
     * Error retrieving payment history
     */
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Overdue Installments
|--------------------------------------------------------------------------
| Purpose:
| Retrieves all overdue installments across all contracts.
|
| Used For:
| - COB (Close of Business)
| - Risk Monitoring
| - Collection Department
|--------------------------------------------------------------------------
*/
const getOverdue = async (req, res) => {
  try {
    /**
     * Fetch overdue installment list
     */
    const data = await paymentService.getOverdueInstallments();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    /**
     * System error while retrieving overdue data
     */
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  pay,
  getHistory,
  getOverdue,
};
