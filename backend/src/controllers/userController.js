const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const Favorite = require('../models/Favorite');

/**
 * Controller to get full profile for authenticated user
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch loan and favorite metrics in parallel for rich dashboard data
    const [activeLoansCount, totalLoansCount, favoritesCount] =
      await Promise.all([
        Borrow.countDocuments({ user: userId, status: 'borrowed' }),
        Borrow.countDocuments({ user: userId }),
        Favorite.countDocuments({ user: userId }),
      ]);

    const userObj = req.user.toJSON();

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...userObj,
          stats: {
            activeLoansCount,
            totalLoansCount,
            favoritesCount,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update authenticated user's profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      name,
      phone,
      branch,
      bio,
      avatar,
      currentPassword,
      newPassword,
    } = req.body;

    // Fetch user with passwordHash in case password is being updated
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found.',
        },
      });
    }

    // Update basic profile fields if provided
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.profile.phone = phone.trim();
    if (branch !== undefined) user.profile.branch = branch.trim();
    if (bio !== undefined) user.profile.bio = bio.trim();
    if (avatar !== undefined) user.profile.avatar = avatar.trim();

    // Handle password change if requested
    if (newPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Current password provided is incorrect.',
          },
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.cardId': { $regex: search, $options: 'i' } },
      ];
    }
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (status && status !== 'all') {
      filter['profile.status'] = status;
    }
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
};
