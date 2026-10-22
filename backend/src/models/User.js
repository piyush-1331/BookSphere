const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Hidden by default from queries unless explicitly selected
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin"',
      },
      default: 'user',
      index: true,
    },
    profile: {
      cardId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true,
      },
      branch: {
        type: String,
        default: 'Metropolitan Central (Flagship)',
        trim: true,
      },
      quotaLimit: {
        type: Number,
        default: 10,
        min: [1, 'Quota limit must be at least 1'],
        max: [50, 'Quota limit cannot exceed 50'],
      },
      status: {
        type: String,
        enum: ['active', 'grace_period', 'flagged', 'inactive'],
        default: 'active',
        index: true,
      },
      avatar: {
        type: String,
        default: '',
      },
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: '',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
      membershipTier: {
        type: String,
        default: 'General Patron',
        trim: true,
      },
    },
    preferences: {
      favorite_genres: {
        type: [String],
        default: [],
      },
      favorite_categories: {
        type: [String],
        default: [],
      },
      favorite_authors: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook: generate cardId if none exists
userSchema.pre('save', function () {
  if (!this.profile) {
    this.profile = {};
  }
  if (!this.profile.cardId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const charCode = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    this.profile.cardId = `BKSP-${randomSuffix}-${charCode}`;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
