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

const validate = require("../middleware/validate");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createLoanProductSchema,
  updateLoanProductSchema,
} = require("../validators/loanProductValidator");

const {
  create,
  getAll,
  getById,
  updateProduct,
  deleteProduct,
} = require("../controllers/loanProductController");

/*
|--------------------------------------------------------------------------
| LOAN PRODUCT ROUTES (Role-Based Access Control)
|--------------------------------------------------------------------------
*/

// Get all products (All staff roles)
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getAll,
);

// Get a single product by ID (All staff roles)
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "loan_officer", "cashier"),
  getById,
);

// Create a new product (Management only)
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "manager", "loan_officer"),
  validate(createLoanProductSchema),
  create,
);

// Update an existing product by ID (Management only)
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "loan_officer"),
  validate(updateLoanProductSchema),
  updateProduct,
);

// Delete a product by ID (High privilege management only)
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "manager", "loan_offier"), // Restricting delete access slightly tighter
  deleteProduct,
);

module.exports = router;
