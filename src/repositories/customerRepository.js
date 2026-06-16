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

/**
 * ==========================================================================
 * Customer Repository
 * ==========================================================================
 * Purpose:
 * Handles all customer database operations.
 *
 * Responsibilities:
 * - CRUD Operations
 * - Customer Directory Queries
 * - Search Queries
 * - Pagination Queries
 *
 * Layer:
 * Repository Layer
 * ==========================================================================
 */

/*
|--------------------------------------------------------------------------
| Insert Customer Record
|--------------------------------------------------------------------------
| Table:
| customers
|
| Fields:
| - customer_code
| - full_name
| - gender
| - date_of_birth
| - phone
| - email
| - national_id
| - occupation
| - address
| - created_by
|--------------------------------------------------------------------------
*/
const create = async (customer) => {
  const [result] = await pool.query(
    `
    INSERT INTO customers
    (
      customer_code,
      full_name,
      gender,
      date_of_birth,
      phone,
      email,
      national_id,
      occupation,
      address,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      customer.customer_code,
      customer.full_name,
      customer.gender,
      customer.date_of_birth,
      customer.phone,
      customer.email,
      customer.national_id,
      customer.occupation,
      customer.address,
      customer.creatorId,
    ],
  );

  return { id: result.insertId, ...customer };
};

/*
|--------------------------------------------------------------------------
| Customer Directory Query
|--------------------------------------------------------------------------
| Purpose:
| Returns customer information together with:
|
| - Loan Contract Information
| - Remaining Balance
| - Payment Status
|
| Payment Status Logic:
| overdue  -> At least one overdue installment
| paid     -> At least one paid installment
| pending  -> No paid or overdue installments
|--------------------------------------------------------------------------
*/
const getLast = async () => {
  return await pool.query(`
    SELECT id FROM customers ORDER BY id DESC LIMIT 1
  `);
};

/*
|--------------------------------------------------------------------------
| Count Customer Directory Records
|--------------------------------------------------------------------------
| Purpose:
| Calculates total records for pagination.
|
| Used By:
| Customer Directory Screen
|--------------------------------------------------------------------------
*/
const getAll = async ({ search, limit, offset }) => {
  return await pool.query(
    `
    SELECT *
    FROM customers
    WHERE customer_code LIKE ?
       OR full_name LIKE ?
       OR phone LIKE ?
    ORDER BY id DESC
    LIMIT ?
    OFFSET ?
    `,
    [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset],
  );
};

/*
|--------------------------------------------------------------------------
| Get Customer Directory (With Search & Pagination)
|--------------------------------------------------------------------------
*/
const getAllCustomerDirectory = async ({
  search,
  payment_status,
  limit,
  offset,
}) => {
  return await pool.query(
    `
    SELECT
      c.id,
      c.customer_code,
      c.full_name,
      c.phone,
      c.email,
      ls.id AS contract_id,
      ls.contract_no,
      ls.principal_amount,
      ls.term_months,
      ls.remaining_balance,
      ls.status AS contract_status,

      CASE
        WHEN SUM(CASE WHEN ps.status = 'overdue' THEN 1 ELSE 0 END) > 0
          THEN 'overdue'
        WHEN SUM(CASE WHEN ps.status = 'paid' THEN 1 ELSE 0 END) > 0
          THEN 'paid'
        ELSE 'pending'
      END AS payment_status

    FROM customers c
    LEFT JOIN loan_contracts ls
      ON c.id = ls.customer_id
    LEFT JOIN payment_schedules ps
      ON ls.id = ps.contract_id

    WHERE
      c.customer_code LIKE ?
      OR c.full_name LIKE ?
      OR c.phone LIKE ?

    GROUP BY
      c.id,
      c.customer_code,
      c.full_name,
      c.phone,
      c.email,
      ls.id,
      ls.contract_no,
      ls.principal_amount,
      ls.term_months,
      ls.remaining_balance,
      ls.status

    HAVING
      (? = '' OR payment_status = ?)

    ORDER BY c.id DESC
    LIMIT ?
    OFFSET ?
    `,
    [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      payment_status || "",
      payment_status || "",
      Number(limit),
      Number(offset),
    ],
  );
};

/*
|--------------------------------------------------------------------------
| Count Directory Records
|--------------------------------------------------------------------------
*/
const countCustomerDirectory = async (search, payment_status) => {
  return await pool.query(
    `
    SELECT COUNT(*) total
    FROM (
      SELECT
        c.id,

        CASE
          WHEN SUM(CASE WHEN ps.status = 'overdue' THEN 1 ELSE 0 END) > 0
            THEN 'overdue'
          WHEN SUM(CASE WHEN ps.status = 'paid' THEN 1 ELSE 0 END) > 0
            THEN 'paid'
          ELSE 'pending'
        END AS payment_status

      FROM customers c
      LEFT JOIN loan_contracts ls
        ON c.id = ls.customer_id
      LEFT JOIN payment_schedules ps
        ON ls.id = ps.contract_id

      WHERE
        c.customer_code LIKE ?
        OR c.full_name LIKE ?
        OR c.phone LIKE ?

      GROUP BY c.id

      HAVING
        (? = '' OR payment_status = ?)
    ) t
    `,
    [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      payment_status || "",
      payment_status || "",
    ],
  );
};

/*
|--------------------------------------------------------------------------
| Count Customers
|--------------------------------------------------------------------------
*/
const countAll = async (search) => {
  return await pool.query(
    `
    SELECT COUNT(*) as total
    FROM customers
    WHERE customer_code LIKE ?
       OR full_name LIKE ?
       OR phone LIKE ?
    `,
    [`%${search}%`, `%${search}%`, `%${search}%`],
  );
};

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/
const getById = async (id) => {
  return await pool.query(`SELECT * FROM customers WHERE id = ?`, [id]);
};

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/
const update = async (id, data) => {
  return await pool.query(
    `
    UPDATE customers
    SET
      full_name=?,
      gender=?,
      date_of_birth=?,
      phone=?,
      email=?,
      national_id=?,
      occupation=?,
      address=?
    WHERE id=?
    `,
    [
      data.full_name,
      data.gender,
      data.date_of_birth,
      data.phone,
      data.email,
      data.national_id,
      data.occupation,
      data.address,
      id,
    ],
  );
};

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/
const remove = async (id) => {
  return await pool.query(`DELETE FROM customers WHERE id=?`, [id]);
};

module.exports = {
  create,
  getLast,
  getAll,
  countAll,
  getById,
  getAllCustomerDirectory,
  countCustomerDirectory,
  update,
  remove,
};
