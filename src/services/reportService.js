/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Report Management
 * File        : reportService.js
 * Description : Business logic coordination rules processing for core data sets
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

const getCustomerStatement = async (searchParam) => {
  return repo.getCustomerStatement(searchParam);
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
