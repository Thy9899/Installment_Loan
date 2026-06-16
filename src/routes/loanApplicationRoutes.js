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
  submitApplication,
} = require("../controllers/loanApplicationController");

// Single endpoint parsing the composite incoming payload data structure
router.post(
  "/submit",
  verifyToken,
  authorizeRoles("admin", "manager", "loan_officier"),
  submitApplication,
);

module.exports = router;
