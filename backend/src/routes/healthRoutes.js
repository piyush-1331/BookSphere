const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    System health check & MongoDB connectivity audit
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;
