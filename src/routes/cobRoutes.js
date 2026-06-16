/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Close of Business (COB)
 * File        : cobRoutes.js
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

const { runCOB, getSystemDate } = require("../controllers/cobController");

/*
|--------------------------------------------------------------------------
| Execute Close of Business (COB)
|--------------------------------------------------------------------------
| Endpoint:
| POST /cob/run
|
| Purpose:
| Triggers end-of-day financial processing:
| - Interest calculation
| - Installment updates
| - Penalty processing
| - Business date advancement
|
| Access Control:
| Admin, Manager only
|--------------------------------------------------------------------------
*/
router.post("/run", verifyToken, authorizeRoles("admin", "manager"), runCOB);

/*
|--------------------------------------------------------------------------
| Get System Business Date
|--------------------------------------------------------------------------
| Endpoint:
| GET /cob/date
|
| Purpose:
| Returns current business date used in COB processing
|
| Access:
| Authenticated users only
|--------------------------------------------------------------------------
*/
router.get("/date", verifyToken, getSystemDate);

module.exports = router;
