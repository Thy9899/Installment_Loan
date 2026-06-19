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

const {
  getLoanPortfolio,
  getDailyCollection,
  getOverdueLoans,
  getCustomerStatement,
  getOutstandingBalances,
} = require("../controllers/reportController");

// Secure all reporting endpoints behind authentication token validations
router.use(verifyToken);

router.get("/loan-portfolio", getLoanPortfolio);

router.get("/daily-collection", getDailyCollection);

router.get("/overdue-loans", getOverdueLoans);

router.get("/customer-statement", getCustomerStatement);

router.get("/outstanding-balances", getOutstandingBalances);

module.exports = router;
