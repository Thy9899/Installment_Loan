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

const repo = require("../repositories/loanProductRepository");

/*
|--------------------------------------------------------------------------
| Generate Product Code
|--------------------------------------------------------------------------
| Purpose:
| Generates unique loan product code.
|
| Example:
| LP1750846154000
|--------------------------------------------------------------------------
*/
const generateCode = async () => {
  // Generate timestamp-based product codes
  return `LP${Date.now()}`;
};

/*
|--------------------------------------------------------------------------
| Create Loan Product
|--------------------------------------------------------------------------
| Business Logic:
| 1. Generate product code.
| 2. Merge code into payload.
| 3. Save through repository layer.
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  // Generate unique product code
  const productCode = await generateCode();

  // Merge product code into request data
  const productData = { ...data, product_code: productCode };

  // Save product
  const result = await repo.create(productData);

  return { id: result.insertId, ...productData };
};

/*
|--------------------------------------------------------------------------
| Retrieve Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Retrieves a loan product by its identifier.
|
| Throws:
| Error if product does not exist.
|--------------------------------------------------------------------------
*/
const getAll = async () => {
  return repo.getAll();
};

/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/
const getById = async (id) => {
  const product = await repo.getById(id);

  if (!product) {
    throw new Error(`Loan product with ID ${id} not found`);
  }

  return product;
};

/*
|--------------------------------------------------------------------------
| Update Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Updates one or more loan product fields.
|
| Features:
| - Dynamic Updates
| - Partial Payload Support
|--------------------------------------------------------------------------
*/
const updateProduct = async (id, data) => {
  // Update selected fields only
  const result = await repo.updateProduct(id, data);

  if (result.affectedRows === 0) {
    throw new Error(`Loan product with ID ${id} not found`);
  }

  // Return the dynamic data mix to the controller
  return { id, ...data };
};

/*
|--------------------------------------------------------------------------
| Delete Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Permanently removes loan product.
|
| Validation:
| Ensures record exists before deletion.
|--------------------------------------------------------------------------
*/
const deleteProduct = async (id) => {
  const result = await repo.deleteProduct(id);

  if (result.affectedRows === 0) {
    throw new Error(`Loan product with ID ${id} not found`);
  }

  return true;
};

module.exports = {
  create,
  getAll,
  getById,
  updateProduct,
  deleteProduct,
};
