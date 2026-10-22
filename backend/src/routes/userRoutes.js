const express = require('express');
const {
  getProfile,
  updateProfile,
  getAllUsers,
} = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../schemas/authSchemas');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    List all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticate, requireAdmin, getAllUsers);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile with loan & favorites statistics
 * @access  Private (Authenticated)
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile information or password
 * @access  Private (Authenticated)
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema, 'body'),
  updateProfile
);

module.exports = router;
