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

const service = require("../services/customerService");

/**
 * ==========================================================================
 * Customer Controller
 * ==========================================================================
 * Purpose:
 * Handles HTTP requests related to customer management.
 *
 * Responsibilities:
 * - Create Customer
 * - Retrieve Customer List
 * - Retrieve Customer Details
 * - Customer Directory Search
 * - Update Customer
 * - Delete Customer
 *
 * Layer:
 * Controller Layer
 * ==========================================================================
 */

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
| Purpose:
| Creates a new customer record.
|
| Process:
| 1. Retrieve authenticated user ID.
| 2. Attach creator information.
| 3. Forward payload to service layer.
| 4. Return created customer information.
|
| Access:
| Authenticated Users
|--------------------------------------------------------------------------
*/
const create = async (req, res) => {
  try {
    const creatorId = req.user ? req.user.id : null;

    // Merge creatorId directly into the single payload object sent to the service
    const result = await service.create({
      ...req.body,
      creatorId: creatorId,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Customers
|--------------------------------------------------------------------------
| Purpose:
| Retrieves paginated customer records.
|
| Features:
| - Search
| - Pagination
| - Sorting
|--------------------------------------------------------------------------
*/
const getAll = async (req, res) => {
  try {
    const result = await service.getAll(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Customer By ID
|--------------------------------------------------------------------------
| Purpose:
| Retrieves detailed information for a single customer.
|
| Parameters:
| - id (Route Parameter)
|--------------------------------------------------------------------------
*/
const getById = async (req, res) => {
  try {
    const result = await service.getById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Customer Directory
|--------------------------------------------------------------------------
| Purpose:
| Provides customer listing with loan information.
|
| Features:
| - Customer Search
| - Payment Status Filter
| - Pagination
| - Contract Information
|--------------------------------------------------------------------------
*/
const getCustomerDirectory = async (req, res) => {
  try {
    const result = await service.getCustomerDirectory(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
| Purpose:
| Updates customer profile information.
|
| Parameters:
| - id (Route Parameter)
|--------------------------------------------------------------------------
*/
const update = async (req, res) => {
  try {
    await service.update(req.params.id, req.body);

    res.json({
      success: true,
      message: "Customer updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Customer
|--------------------------------------------------------------------------
| Purpose:
| Removes a customer record from the system.
|
| Warning:
| Ensure customer has no active loan contracts before deletion.
|--------------------------------------------------------------------------
*/
const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getCustomerDirectory,
  update,
  remove,
};
