/**
 * --------------------------------------------------------------------------
 * Database Connection Pool Configuration
 * --------------------------------------------------------------------------
 * Creates and exports a MySQL connection pool using mysql2/promise.
 *
 * Benefits:
 * - Reuses database connections
 * - Improves performance
 * - Handles multiple concurrent requests efficiently
 * - Prevents unnecessary connection creation
 * --------------------------------------------------------------------------
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Connection Pool Settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
