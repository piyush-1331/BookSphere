const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

/**
 * Controller for user registration
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, branch, phone, bio } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if account already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists. Please sign in.',
        },
      });
    }

    // Hash password with bcryptjs salt factor 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user (Strictly enforce role as 'user' - users cannot register as admin)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user', // Enforce 'user' role strictly
      profile: {
        branch: branch || 'Metropolitan Central (Flagship)',
        phone: phone || '',
        bio: bio || '',
        status: 'active',
        membershipTier: 'General Patron',
      },
    });

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Set secure HttpOnly cookie
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for user login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user with passwordHash explicitly selected
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordHash'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
    }

    // Verify password against stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
    }

    // Check account standing
    if (user.profile && user.profile.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'This account has been deactivated. Please contact administration.',
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Set secure HttpOnly cookie
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for user logout
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
};

/**
 * Controller for fetching current authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
