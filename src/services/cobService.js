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

/*
|--------------------------------------------------------------------------
| Generate Customer Code
|--------------------------------------------------------------------------
*/
const generateCode = async () => {
  const [rows] = await repo.getLast();

  let next = 1;
  if (rows.length > 0) next = rows[0].id + 1;

  return `RC-${String(next).padStart(5, "0")}`;
};

/*
|--------------------------------------------------------------------------
| Run Close of Business Process (CORE ENGINE)
|--------------------------------------------------------------------------
*/
const runCOB = async (data) => {
  // Explicitly destructure run_by from the passed payload data object
  const { run_by } = data;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
    -----------------------------------
    Get Current Business Date
    -----------------------------------
    */
    const [settings] = await connection.query(`
      SELECT business_date FROM system_settings LIMIT 1
    `);

    if (!settings.length) {
      throw new Error("System configuration settings missing in database.");
    }

    const businessDateStr = settings[0].business_date;
    const businessDate = new Date(businessDateStr);

    /*
    -----------------------------------
    Dynamic Penalty Accrual Engine
    -----------------------------------
    */
    const [overdueItems] = await connection.query(
      `
      SELECT id, due_date, penalty_amount 
      FROM payment_schedules 
      WHERE due_date < ? AND status IN ('pending', 'partial', 'overdue')
      `,
      [businessDateStr],
    );

    for (let item of overdueItems) {
      const dueDate = new Date(item.due_date);

      const diffTime = businessDate - dueDate;
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const dynamicPenalty = daysOverdue > 0 ? daysOverdue * 1.0 : 0;

      await connection.query(
        `
        UPDATE payment_schedules
        SET status = 'overdue',
            penalty_amount = ?
        WHERE id = ?
        `,
        [dynamicPenalty, item.id],
      );
    }

    /*
    -----------------------------------
    Metrics & Statistics Analytics
    -----------------------------------
    */
    const [customerRows] = await connection.query(
      `SELECT COUNT(*) total FROM customers`,
    );
    const [loanRows] = await connection.query(
      `SELECT COUNT(*) total FROM loan_contracts WHERE status='active'`,
    );
    const [outstandingRows] = await connection.query(
      `SELECT SUM(remaining_balance) total FROM loan_contracts`,
    );
    const [collectionRows] = await connection.query(
      `SELECT SUM(amount_paid) total FROM payments WHERE DATE(payment_date) = ?`,
      [businessDateStr],
    );
    const [overdueRows] = await connection.query(
      `SELECT COUNT(*) total FROM payment_schedules WHERE status='overdue'`,
    );

    /*
    -----------------------------------
    Save Snapshot Log Record
    -----------------------------------
    */
    // FIX: Removed trailing comma after run_by to prevent structural SQL parse errors
    await connection.query(
      `
      INSERT INTO cob_history
      (
        business_date,
        total_customers,
        active_loans,
        total_outstanding,
        total_collected,
        total_overdue,
        run_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessDateStr,
        customerRows[0].total,
        loanRows[0].total,
        outstandingRows[0].total || 0,
        collectionRows[0].total || 0,
        overdueRows[0].total,
        run_by || null, // Cleanly bound from input args context mapping
      ],
    );

    /*
    -----------------------------------
    Advance System Business Date
    -----------------------------------
    */
    await connection.query(`
      UPDATE system_settings
      SET business_date = DATE_ADD(business_date, INTERVAL 1 DAY),
          last_cob_at = NOW()
    `);

    await connection.commit();

    return {
      success: true,
      message: "COB processed and completed successfully.",
      processed_business_date: businessDateStr,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| Internal Helper: Get Current System Business Date
|--------------------------------------------------------------------------
*/
const getSystemDate = async () => {
  const [rows] = await pool.query(
    "SELECT business_date FROM system_settings LIMIT 1",
  );
  return rows.length
    ? rows[0].business_date
    : new Date().toISOString().split("T")[0];
};

module.exports = {
  runCOB,
  getSystemDate,
};
