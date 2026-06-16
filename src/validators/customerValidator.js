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

const Joi = require("joi");

const createCustomerSchema = Joi.object({
  full_name: Joi.string().min(3).required(),

  gender: Joi.string().valid("Male", "Female").required(),

  date_of_birth: Joi.date().optional(),

  phone: Joi.string().required(),

  email: Joi.string().email().allow("", null),

  national_id: Joi.string().allow("", null),

  occupation: Joi.string().allow("", null),

  address: Joi.string().allow("", null),
});

const updateCustomerSchema = createCustomerSchema;

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
