const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for sensitive authentication endpoints (login, register)
 * Prevents brute-force credential stuffing and denial of service.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => process.env.NODE_ENV === 'test', // Bypass in test suites
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      },
    });
  },
});

/**
 * General rate limiter for all public and API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please slow down and try again later.',
      },
    });
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};

