const Borrow = require('../models/Borrow');

/**
 * Service to process and audit overdue borrowings.
 * Transitions active borrowings past their dueDate from 'borrowed' to 'overdue'.
 * Safe, idempotent, and transactional.
 *
 * @returns {Promise<{ scannedAt: Date, updatedCount: number }>}
 */
const syncOverdueLoans = async () => {
  const now = new Date();

  // Find and update all active loans that have passed their dueDate
  const result = await Borrow.updateMany(
    {
      status: 'borrowed',
      dueDate: { $lt: now },
    },
    {
      $set: { status: 'overdue' },
    }
  );

  return {
    scannedAt: now,
    updatedCount: result.modifiedCount || 0,
  };
};

/**
 * Helper to compute virtual overdue status for individual records
 * without silently mutating the database.
 * @param {object} borrowRecord
 * @returns {boolean}
 */
const isLoanOverdue = (borrowRecord) => {
  if (!borrowRecord || !borrowRecord.dueDate) return false;
  if (borrowRecord.status === 'returned') return false;
  return new Date(borrowRecord.dueDate).getTime() < Date.now();
};

module.exports = {
  syncOverdueLoans,
  isLoanOverdue,
};
