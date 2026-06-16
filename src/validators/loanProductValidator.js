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

const createLoanProductSchema = Joi.object({
  product_name: Joi.string().required(),

  description: Joi.string().required(),

  interest_rate: Joi.number().required(),

  processing_fee: Joi.number().required(),

  min_amount: Joi.number().required(),

  max_amount: Joi.number().required(),

  max_term_months: Joi.number().required(),
});

const updateLoanProductSchema = Joi.object({
  product_name: Joi.string().optional(),

  description: Joi.string().optional(),

  interest_rate: Joi.number().optional(),

  processing_fee: Joi.number().optional(),

  min_amount: Joi.number().optional(),

  max_amount: Joi.number().optional(),

  max_term_months: Joi.number().optional(),
}).min(1);

module.exports = {
  createLoanProductSchema,
  updateLoanProductSchema,
};
