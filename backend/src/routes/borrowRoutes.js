const express = require('express');
const {
  borrowBook,
  getMyBorrows,
  getBorrowById,
  returnBook,
  getAllBorrows,
  approveBorrow,
  rejectBorrow,
} = require('../controllers/borrowController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createBorrowSchema,
  borrowParamSchema,
  borrowQuerySchema,
} = require('../schemas/borrowSchemas');

const router = express.Router();

// All borrow endpoints require authentication
router.use(authenticate);

/**
 * @route   GET /api/borrows
 * @desc    List all system borrowings (Admin only)
 * @access  Private (Admin)
 */
router.get('/', requireAdmin, getAllBorrows);

/**
 * @route   POST /api/borrows
 * @desc    Request and checkout a book volume
 * @access  Private (Authenticated)
 */
router.post('/', validate(createBorrowSchema, 'body'), borrowBook);

/**
 * @route   GET /api/borrows/my
 * @desc    List authenticated user's borrowings (active, overdue, returned)
 * @access  Private (Authenticated)
 */
router.get('/my', validate(borrowQuerySchema, 'query'), getMyBorrows);

/**
 * @route   GET /api/borrows/:id
 * @desc    Fetch specific loan record details (owner or admin)
 * @access  Private (Authenticated)
 */
router.get('/:id', validate(borrowParamSchema, 'params'), getBorrowById);

/**
 * @route   PATCH /api/borrows/:id/return
 * @desc    Return a borrowed book volume
 * @access  Private (Authenticated / Admin)
 */
router.patch('/:id/return', validate(borrowParamSchema, 'params'), returnBook);

/**
 * @route   PATCH /api/borrows/:id/approve
 * @desc    Approve a pending loan request
 * @access  Private (Admin)
 */
router.patch(
  '/:id/approve',
  requireAdmin,
  validate(borrowParamSchema, 'params'),
  approveBorrow
);

/**
 * @route   PATCH /api/borrows/:id/reject
 * @desc    Reject a borrow request
 * @access  Private (Admin)
 */
router.patch(
  '/:id/reject',
  requireAdmin,
  validate(borrowParamSchema, 'params'),
  rejectBorrow
);

module.exports = router;
