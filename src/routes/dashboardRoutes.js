/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Dashboard
 * File        : dashboardRoutes.js
 * Description : Dashboard API endpoints
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { getDashboard } = require("../controllers/dashboardController");

/*
|--------------------------------------------------------------------------
| GET /api/dashboard
|--------------------------------------------------------------------------
| Purpose:
| Returns dashboard KPI summary.
|
| Authorization:
| - Admin
| - Manager
|
| Security:
| - Requires valid JWT token
| - Requires appropriate role permissions
|--------------------------------------------------------------------------
*/
router.get("/", verifyToken, authorizeRoles("admin", "manager"), getDashboard);

module.exports = router;
