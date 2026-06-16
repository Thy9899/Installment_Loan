/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Auth Routes
 * File        : authRoutes.js
 * Description : Contains business logic for loan products
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const express = require("express");
const router = express.Router();

/**
 * ==========================================================================
 * Authentication Routes
 * ==========================================================================
 * Handles:
 * - Registration
 * - Login
 * - User Profile
 * - Profile Updates
 * ==========================================================================
 */

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  register,
  login,
  updateAdmin,
  profile,
} = require("../controllers/authController");

/*
|--------------------------------------------------------------------------
| POST /api/auth/register
|--------------------------------------------------------------------------
| Create new user account
| Access: Admin Only
|--------------------------------------------------------------------------
*/
router.post("/register", verifyToken, authorizeRoles("admin"), register);

/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
| Authenticate user and generate JWT token
| Access: Public
|--------------------------------------------------------------------------
*/
router.post("/login", login);

/*
|--------------------------------------------------------------------------
| PUT /api/auth/update
|--------------------------------------------------------------------------
| Update current authenticated user's profile
| Access: Authenticated Users
|--------------------------------------------------------------------------
*/
router.put("/update", verifyToken, updateAdmin);

/*
|--------------------------------------------------------------------------
| GET /api/auth/profile
|--------------------------------------------------------------------------
| Retrieve current authenticated user's profile
| Access: Authenticated Users
|--------------------------------------------------------------------------
*/
router.get("/profile", verifyToken, profile);

module.exports = router;
