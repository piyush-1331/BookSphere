const jwt = require('jsonwebtoken');

/**
 * Parses a duration string (e.g., '1h', '7d', '15m') into milliseconds.
 * Defaults to 1 hour (3600000 ms) if not specified or unrecognized.
 * @param {string} duration
 * @returns {number} milliseconds
 */
const parseDurationToMs = (duration) => {
  if (!duration) return 60 * 60 * 1000; // 1 hour default
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
};

/**
 * Generates a signed JWT for a user
 * @param {object} payload - { id, email, role }
 * @param {string} [expiresIn] - Optional custom expiry
 * @returns {string} Signed JWT
 */
const generateToken = (payload, expiresIn) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const expiration = expiresIn || process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, secret, { expiresIn: expiration });
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return jwt.verify(token, secret);
};

/**
 * Cookie options for secure HttpOnly session storage
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const expiryStr = process.env.JWT_EXPIRES_IN || '1h';
  const maxAgeMs = parseDurationToMs(expiryStr);

  return {
    httpOnly: true, // Prevents access from client-side JavaScript (mitigates XSS)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // CSRF mitigation
    maxAge: maxAgeMs,
    path: '/',
  };
};

/**
 * Sets the authentication JWT as a secure HttpOnly cookie on the response
 * @param {import('express').Response} res
 * @param {string} token
 */
const setAuthCookie = (res, token) => {
  const options = getCookieOptions();
  res.cookie('token', token, options);
};

/**
 * Clears the authentication cookie on logout
 * @param {import('express').Response} res
 */
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  parseDurationToMs,
};
