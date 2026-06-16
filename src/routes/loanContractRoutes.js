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
  createLoan,
  getLoans,
  getLoanById,
  getLoanSchedule,
} = require("../controllers/loanContractController");

// Automatically apply token validation to all endpoints listed below
router.use(verifyToken);

// Creation endpoint explicitly gated by high-level management privileges
router.post(
  "/",
  authorizeRoles("admin", "manager", "loan_officer"),
  createLoan,
);

// General viewing permissions open to authorized system users
router.get(
  "/",
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getLoans,
);
router.get(
  "/:id",
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getLoanById,
);
router.get(
  "/schedule/:id",
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getLoanSchedule,
);

module.exports = router;
