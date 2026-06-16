/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Loan Product Management
 * File        : loanProductController.js
 * Description : Handles loan product API requests
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const service = require("../services/loanProductService");

/*
|--------------------------------------------------------------------------
| Create Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Creates a new loan product in the system.
|
| Process:
| 1. Validate request payload.
| 2. Generate unique product code.
| 3. Save product information.
| 4. Return created product details.
|
| Access:
| Admin
| Manager
| Loan Officer
|--------------------------------------------------------------------------
*/
const create = async (req, res) => {
  try {
    // Create product through service layer
    const newProduct = await service.create(req.body);

    // Return success response
    res.status(201).json({
      success: true,
      message: "Loan product created successfully",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Loan Products
|--------------------------------------------------------------------------
| Purpose:
| Retrieves all loan products available in the system.
|
| Features:
| - Product listing
| - Product selection for loan applications
|
| Access:
| All Authorized Staff
|--------------------------------------------------------------------------
*/
const getAll = async (req, res) => {
  try {
    // Retrieve loan product list
    const data = await service.getAll();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Loan Product By ID
|--------------------------------------------------------------------------
| Purpose:
| Retrieves detailed information for a specific loan product.
|
| Parameters:
| - id (Route Parameter)
|--------------------------------------------------------------------------
*/
const getById = async (req, res) => {
  try {
    // Extract product ID from route parameter
    const { id } = req.params;

    // Retrieve product details
    const data = await service.getById(id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Updates existing loan product information.
|
| Features:
| - Partial Updates
| - Dynamic Field Mapping
|
| Parameters:
| - id (Route Parameter)
|--------------------------------------------------------------------------
*/
const updateProduct = async (req, res) => {
  try {
    // Retrieve product ID
    const { id } = req.params;

    // Update product through service layer
    const updatedProduct = await service.updateProduct(id, req.body);

    res.json({
      success: true,
      message: "Loan product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    // Catching specific "Not Found" error thrown by the service
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Loan Product
|--------------------------------------------------------------------------
| Purpose:
| Removes a loan product from the system.
|
| Business Rule:
| Product should not be deleted if it is referenced
| by active loan contracts.
|--------------------------------------------------------------------------
*/
const deleteProduct = async (req, res) => {
  try {
    // Retrieve product ID
    const { id } = req.params;

    // Delete product
    await service.deleteProduct(id);

    res.json({
      success: true,
      message: "Loan product deleted successfully",
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  updateProduct,
  deleteProduct,
};
