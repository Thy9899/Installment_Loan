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

const { getSystemDate } = require("./cobService");

/*
|--------------------------------------------------------------------------
| Mark Overdue Installments
|--------------------------------------------------------------------------
*/
const updateOverdues = async () => {
  const today = new Date(await getSystemDate());

  // Find overdue schedules
  const [rows] = await pool.query(
    `
    SELECT *
    FROM payment_schedules
    WHERE due_date < ?
    AND status != 'paid'
    `,
    [today],
  );

  for (let item of rows) {
    // Calculate days overdue
    const dueDate = new Date(item.due_date);
    const currentDate = new Date(today);

    const diffTime = currentDate - dueDate;

    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Simple penalty rule: $1 per day
    const penalty = daysOverdue * 1;

    await pool.query(
      `
      UPDATE payment_schedules
      SET status = 'overdue',
          penalty_amount = ?
      WHERE id = ?
      `,
      [penalty, item.id],
    );
  }

  return {
    message: "Overdue updated",
    total: rows.length,
  };
};

module.exports = {
  updateOverdues,
};
