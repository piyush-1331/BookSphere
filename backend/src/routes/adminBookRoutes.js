const express = require('express');
const {
  createBook,
  updateBook,
  deleteBook,
  auditOverdueLoans,
  getAdminDashboardStats,
} = require('../controllers/adminBookController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createBookSchema,
  updateBookSchema,
  adminBookParamSchema,
} = require('../schemas/adminBookSchemas');

const router = express.Router();

// All admin book routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/books/dashboard/stats
 * @desc    Fetch comprehensive admin dashboard metrics & recent loans
 * @access  Private (Admin Only)
 */
router.get('/dashboard/stats', getAdminDashboardStats);

/**
 * @route   POST /api/admin/books
 * @desc    Catalog and register a new book title
 * @access  Private (Admin Only)
 */
router.post('/', validate(createBookSchema, 'body'), createBook);

/**
 * @route   PATCH /api/admin/books/:id
 * @desc    Update book metadata or stock quantities
 * @access  Private (Admin Only)
 */
router.patch(
  '/:id',
  validate(adminBookParamSchema, 'params'),
  validate(updateBookSchema, 'body'),
  updateBook
);

/**
 * @route   DELETE /api/admin/books/:id
 * @desc    Safely remove a book from the catalog
 * @access  Private (Admin Only)
 */
router.delete('/:id', validate(adminBookParamSchema, 'params'), deleteBook);

/**
 * @route   POST /api/admin/books/audit-overdue
 * @desc    Trigger audit of overdue loans and status sync
 * @access  Private (Admin Only)
 */
router.post('/audit-overdue', auditOverdueLoans);

module.exports = router;
