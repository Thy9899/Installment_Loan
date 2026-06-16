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

/*
|--------------------------------------------------------------------------
| Insert Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Creates a new loan product record in the database.
|
| Table:
| loan_products
|
| Type:
| Write Operation (INSERT)
|--------------------------------------------------------------------------
*/
const create = async (product) => {
  const [result] = await pool.query(
    `
    INSERT INTO loan_products 
    (
      product_code, 
      product_name, 
      description, 
      interest_rate, 
      processing_fee, 
      min_amount, 
      max_amount, 
      max_term_months
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      product.product_code,
      product.product_name,
      product.description,
      product.interest_rate,
      product.processing_fee,
      product.min_amount,
      product.max_amount,
      product.max_term_months,
    ],
  );
  return result;
};

/*
|--------------------------------------------------------------------------
| Retrieve All Loan Products
|--------------------------------------------------------------------------
| Purpose:
| Fetches all loan products ordered by newest first.
|
| Type:
| Read Operation (SELECT)
|--------------------------------------------------------------------------
*/
const getAll = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM loan_products ORDER BY id DESC`,
  );
  return rows;
};

/*
|--------------------------------------------------------------------------
| Retrieve Loan Product By ID
|--------------------------------------------------------------------------
| Purpose:
| Fetch a single loan product record.
|
| Returns:
| - Object if found
| - Undefined if not found
|--------------------------------------------------------------------------
*/
const getById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT * FROM loan_products 
    WHERE id = ?
    `,
    [id],
  );

  // Return the single object, or undefined if no row matched
  return rows[0];
};

/*
|--------------------------------------------------------------------------
| Update Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Dynamically updates selected fields of a loan product.
|
| Features:
| - Partial update support
| - Dynamic SQL generation
|--------------------------------------------------------------------------
*/
const updateProduct = async (id, product) => {
  const keys = Object.keys(product);

  // If no fields are provided to update, safely exit early
  if (keys.length === 0) return { affectedRows: 0 };

  // Dynamically build the assignment string: "product_name = ?, description = ?"
  const setClause = keys.map((key) => `${key} = ?`).join(", ");

  // Extract values corresponding to the keys dynamic sequence
  const values = keys.map((key) => product[key]);

  // Append ID to the final values array for the WHERE clause
  values.push(id);

  const [result] = await pool.query(
    `
    UPDATE loan_products 
    SET ${setClause}
    WHERE id = ?
    `,
    values,
  );

  return result;
};

/*
|--------------------------------------------------------------------------
| Delete Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Removes a loan product from the system permanently.
|
| Warning:
| Should be restricted if used in active contracts.
|--------------------------------------------------------------------------
*/
const deleteProduct = async (id) => {
  const [result] = await pool.query(
    `
    DELETE FROM loan_products WHERE id = ?`,
    [id],
  );
  return result;
};

module.exports = {
  create,
  getAll,
  getById,
  updateProduct,
  deleteProduct,
};
