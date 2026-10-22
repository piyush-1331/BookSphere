const express = require('express');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { favoriteParamSchema } = require('../schemas/favoriteSchemas');

const router = express.Router();

// All favorites routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/favorites
 * @desc    Fetch authenticated user's favorites shelf
 * @access  Private (Authenticated)
 */
router.get('/', getFavorites);

/**
 * @route   POST /api/favorites/:bookId
 * @desc    Add a book to favorites
 * @access  Private (Authenticated)
 */
router.post('/:bookId', validate(favoriteParamSchema, 'params'), addFavorite);

/**
 * @route   DELETE /api/favorites/:bookId
 * @desc    Remove a book from favorites
 * @access  Private (Authenticated)
 */
router.delete(
  '/:bookId',
  validate(favoriteParamSchema, 'params'),
  removeFavorite
);

module.exports = router;
