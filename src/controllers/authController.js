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

const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * ==========================================================================
 * Authentication Controller
 * ==========================================================================
 * Handles:
 * - User Registration
 * - User Login
 * - Profile Management
 * - JWT Token Generation
 * ==========================================================================
 */

/*
|--------------------------------------------------------------------------
| Register New User
|--------------------------------------------------------------------------
| Purpose:
| Creates a new user account.
|
| Security:
| - Validates required fields
| - Prevents duplicate email addresses
| - Prevents duplicate usernames
| - Hashes passwords before storage
| - Records creator information
| - Generates JWT token after registration
|
| Access:
| Admin Only
|--------------------------------------------------------------------------
*/
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Logged-in admin who creates the account
    const creatorId = req.user ? req.user.id : null;

    /**
     * Validate request payload
     */
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    /**
     * Check duplicate email
     */
    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    /**
     * Check duplicate username
     */
    const [existingUsername] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    /**
     * Encrypt password
     */
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role assignment
    const userRole = role || "admin";

    /**
     * Insert new user record
     */
    const [result] = await pool.query(
      `
      INSERT INTO users
      (
        username,
        email,
        password,
        role,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [username, email, hashedPassword, userRole, "active", creatorId],
    );

    /**
     * Generate authentication token
     */
    const token = jwt.sign(
      {
        id: result.insertId,
        email,
        role: userRole,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.status(201).json({
      success: true,
      message: "Admin account registered successfully",
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role: userRole,
        status: "active",
        created_by: creatorId,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| User Login
|--------------------------------------------------------------------------
| Purpose:
| Authenticates users using email and password.
|
| Security:
| - Verifies email exists
| - Compares encrypted password
| - Generates JWT access token
|
| Access:
| Public
|--------------------------------------------------------------------------
*/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    /**
     * Find user by email
     */
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    /**
     * Verify password
     */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /**
     * Create JWT token
     */
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Current User Profile
|--------------------------------------------------------------------------
| Purpose:
| Allows authenticated users to update:
| - Username
| - Password
|
| Security:
| - User ID comes from JWT token
| - Prevents username duplication
| - Hashes password before saving
|--------------------------------------------------------------------------
*/
const updateAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = req.user.id; // Protected ID from token

    // Build dynamic update arrays based on what fields are provided
    const updateFields = [];
    const queryValues = [];

    // Check if username is being updated
    if (username) {
      // Optional: Check if the new username is already taken by someone else
      const [existingUser] = await pool.query(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId],
      );
      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }

      updateFields.push("username = ?");
      queryValues.push(username);
    }

    // Check if password is being updated
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      queryValues.push(hashedPassword);
    }

    // If no fields were provided in the request body
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // Append the userId to the end of the values array for the WHERE clause
    queryValues.push(userId);

    // 4. Construct and execute the dynamic SQL query
    const sqlQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    await pool.query(sqlQuery, queryValues);

    // Fetch and return the updated user details (excluding password)
    const [updatedRows] = await pool.query(
      "SELECT id, username, email, role, status, created_by FROM users WHERE id = ?",
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedRows[0],
    });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Current User Profile
|--------------------------------------------------------------------------
| Purpose:
| Retrieves fresh user information directly
| from the database.
|
| Benefits:
| - Always returns latest data
| - Avoids stale token information
|
| Access:
| Authenticated Users
|--------------------------------------------------------------------------
*/
const profile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Query the database using the ID saved in the token
    const [rows] = await pool.query(
      "SELECT id, username, email, role, status, created_by FROM users WHERE id = ?",
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fullUser = rows[0];

    res.json({
      success: true,
      user: {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        role: fullUser.role,
        status: fullUser.status,
      },
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  register,
  login,
  updateAdmin,
  profile,
};
