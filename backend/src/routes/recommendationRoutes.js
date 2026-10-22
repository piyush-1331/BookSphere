const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { recommendationRequestSchema } = require('../schemas/recommendationSchemas');

const router = express.Router();

// 2. All recommendations routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/recommendations
 * @desc    Generate personalized book recommendations for authenticated user
 * @access  Private (Authenticated User)
 */
router.post(
  '/',
  validate(recommendationRequestSchema, 'body'),
  getRecommendations
);

module.exports = router;
