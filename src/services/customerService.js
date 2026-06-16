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

const repo = require("../repositories/customerRepository");

/**
 * ==========================================================================
 * Customer Service
 * ==========================================================================
 * Purpose:
 * Contains business logic for customer operations.
 *
 * Responsibilities:
 * - Customer Code Generation
 * - Customer Validation
 * - Pagination Logic
 * - Search Logic
 * - Customer Directory Processing
 *
 * Layer:
 * Service Layer
 * ==========================================================================
 */

/*
|--------------------------------------------------------------------------
| Generate Customer Code
|--------------------------------------------------------------------------
| Purpose:
| Generates unique customer code.
|
| Format:
| CUS00001
| CUS00002
| CUS00003
|--------------------------------------------------------------------------
*/
const generateCode = async () => {
  const [rows] = await repo.getLast();

  let next = 1;
  if (rows.length > 0) next = rows[0].id + 1;

  return `CUS${String(next).padStart(5, "0")}`;
};

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
| Business Logic:
| 1. Generate customer code.
| 2. Attach code to payload.
| 3. Save record through repository.
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  data.customer_code = await generateCode();
  return repo.create(data);
};

/*
|--------------------------------------------------------------------------
| Customer Directory Pipeline
|--------------------------------------------------------------------------
| Purpose:
| Combines customer data and loan data.
|
| Features:
| - Search
| - Pagination
| - Payment Status Filtering
| - Contract Information
|--------------------------------------------------------------------------
*/
const getAll = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || "";

  const offset = (page - 1) * limit;

  const [data] = await repo.getAll({
    search,
    limit,
    offset,
  });

  const [count] = await repo.countAll(search);

  return {
    data,
    total: count[0].total,
    page,
    limit,
  };
};

/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/
const getById = async (id) => {
  const [rows] = await repo.getById(id);

  if (!rows.length) {
    throw new Error("Customer not found");
  }

  return rows[0];
};

/*
|--------------------------------------------------------------------------
| Get Customer Directory Pipeline
|--------------------------------------------------------------------------
*/
const getCustomerDirectory = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || "";
  const payment_status = query.payment_status || "";

  const offset = (page - 1) * limit;

  const [data] = await repo.getAllCustomerDirectory({
    search,
    payment_status,
    limit,
    offset,
  });

  const [count] = await repo.countCustomerDirectory(search, payment_status);

  return {
    data,
    total: count[0].total,
    page,
    limit,
  };
};

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/
const update = async (id, data) => {
  await repo.update(id, data);
};

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/
const remove = async (id) => {
  await repo.remove(id);
};

module.exports = {
  create,
  getAll,
  getById,
  getCustomerDirectory,
  update,
  remove,
};
