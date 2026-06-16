/**
 * ==========================================================================
 * System      : Installment & Loan Management System
 * Module      : Close of Business (COB) Automation
 * File        : cobCronJob.js
 * Description : Scheduled job that runs COB process automatically every day
 * Author      : Chanthy Kean
 * Version     : 1.0.0
 * Created     : 2026
 * ==========================================================================
 */

const cron = require("node-cron");
const cobService = require("../services/cobService");

/*
|--------------------------------------------------------------------------
| Automated Close of Business (COB) Scheduler
|--------------------------------------------------------------------------
| Purpose:
| Executes the COB process automatically every night.
|
| Schedule:
| - Runs daily at 01:00 AM server time
| - Cron Expression: 0 1 * * *
|
| Business Responsibilities:
| - Process overdue loans
| - Update installment statuses
| - Apply penalties/fees
| - Advance system business date
| - Generate COB logs
|
| Type:
| Background Job (Non-blocking)
|
| Risk Level:
| HIGH (Financial critical process)
|--------------------------------------------------------------------------
*/
cron.schedule("0 1 * * *", async () => {
  try {
    /**
     * -------------------------------------------------------------
     * Start COB Automation Process
     * -------------------------------------------------------------
     */
    console.log("Starting automated Close of Business (COB) process...");

    /**
     * -------------------------------------------------------------
     * Execute COB Business Logic
     * -------------------------------------------------------------
     */
    const result = await cobService.runCOB();

    /**
     * -------------------------------------------------------------
     * Log Success Result
     * -------------------------------------------------------------
     */
    console.log("COB process completed successfully:", result);
  } catch (error) {
    /**
     * -------------------------------------------------------------
     * Critical System Failure
     * -------------------------------------------------------------
     * This indicates failure in financial batch processing.
     */
    console.error("CRITICAL: COB automation failed:", error.message);
  }
});
