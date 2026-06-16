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

const express = require("express");
const cors = require("cors");

const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const customerRoutes = require("./routes/customerRoutes");
const loanProductRoutes = require("./routes/loanProductRoutes");
const loanContractRoutes = require("./routes/loanContractRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const loanApplications = require("./routes/loanApplicationRoutes");
const reports = require("./routes/ReportRoutes");
const cobRoutes = require("./routes/cobRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(errorHandler);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/loan-products", loanProductRoutes);
app.use("/api/loan-contracts", loanContractRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/applications", loanApplications);
app.use("/api/reports", reports);
app.use("/api/cob", cobRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "SmartLoan API Running",
  });
});

module.exports = app;
