/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Loan Product Management
 * File        : loanProductRoutes.js
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
const validate = require("../middleware/validate");

const controller = require("../controllers/customerController");
const {
  createCustomerSchema,
  updateCustomerSchema,
} = require("../validators/customerValidator");

router.use(verifyToken);

router.post("/", validate(createCustomerSchema), controller.create);
router.get("/", controller.getAll);
router.get("/directory", controller.getCustomerDirectory);

router.get("/:id", controller.getById);
router.put("/:id", validate(updateCustomerSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
