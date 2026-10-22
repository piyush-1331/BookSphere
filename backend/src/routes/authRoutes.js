const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
} = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new library patron account
 * @access  Public
 */
router.post('/register', authLimiter, validate(registerSchema, 'body'), register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set secure session
 * @access  Public
 */
router.post('/login', authLimiter, validate(loginSchema, 'body'), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Sign out and clear session cookie
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve currently authenticated user session
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, getMe);

/**
 * @route   GET /api/auth/admin-check
 * @desc    Verify administrative authorization
 * @access  Private (Admin Only)
 */
router.get('/admin-check', authenticate, requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin. Administrative authorization verified.',
    data: {
      admin: req.user.name,
      role: req.user.role,
    },
  });
});

module.exports = router;
