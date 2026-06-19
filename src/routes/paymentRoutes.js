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

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  pay,
  getHistory,
  getOverdue,
} = require("../controllers/paymentController");

/*
|--------------------------------------------------------------------------
| TRANSACTION ENTRY ENDPOINTS (Protected with RBAC Gates)
|--------------------------------------------------------------------------
*/

// Secure all structural endpoints under token validation layers automatically
router.use(verifyToken);

// Accept payments from any on-duty front-desk staff role
router.post(
  "/",
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  pay,
);

// Review historically generated settlement rows
router.get(
  "/history/:search",
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getHistory,
);

// Track delinquencies (Typically management reviews these, but front staff can view)
router.get(
  "/overdue",
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getOverdue,
);

module.exports = router;
