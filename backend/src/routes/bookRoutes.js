const express = require('express');
const { getBooks, getBookById } = require('../controllers/bookController');
const validate = require('../middleware/validate');
const {
  bookQuerySchema,
  bookIdParamSchema,
} = require('../schemas/bookSchemas');

const router = express.Router();

/**
 * @route   GET /api/books
 * @desc    Search, filter, paginate, and sort book catalog
 * @access  Public
 */
router.get('/', validate(bookQuerySchema, 'query'), getBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get detailed book record by ObjectId
 * @access  Public
 */
router.get('/:id', validate(bookIdParamSchema, 'params'), getBookById);

module.exports = router;
