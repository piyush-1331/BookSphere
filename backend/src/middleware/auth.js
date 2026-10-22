const { verifyToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token from HttpOnly cookie or Authorization Bearer header.
 * Attaches authenticated user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract from HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization Header (Bearer <token>)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token required. Please sign in.',
        },
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Session has expired. Please sign in again.',
          },
        });
      }
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or malformed authentication token.',
        },
      });
    }

    // Verify user exists and account is active
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account associated with this token no longer exists.',
        },
      });
    }

    if (user.profile && user.profile.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'This account has been deactivated. Please contact library support.',
        },
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware Factory
 * @param  {...string} allowedRoles - e.g. 'admin', 'user'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required before checking permissions.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Access denied. You do not have sufficient permissions to access this resource.',
        },
      });
    }

    next();
  };
};

/**
 * Convenience middleware for admin-only endpoints
 */
const requireAdmin = authorizeRoles('admin');

module.exports = {
  authenticate,
  authorizeRoles,
  requireAdmin,
};
