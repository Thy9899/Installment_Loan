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

const repo = require("../repositories/reportRepository");

const getLoanPortfolio = async () => {
  return repo.getLoanPortfolio();
};

const getDailyCollection = async (businessDate) => {
  return repo.getDailyCollection(businessDate);
};

const getOverdueLoans = async () => {
  return repo.getOverdueLoans();
};

const getCustomerStatement = async (contractId) => {
  return repo.getCustomerStatement(contractId);
};

const getOutstandingBalances = async () => {
  return repo.getOutstandingBalances();
};

module.exports = {
  getLoanPortfolio,
  getDailyCollection,
  getOverdueLoans,
  getCustomerStatement,
  getOutstandingBalances,
};
