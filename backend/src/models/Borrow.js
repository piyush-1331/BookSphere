const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID is required'],
      index: true,
    },
    format: {
      type: String,
      enum: ['epub', 'audiobook', 'hardcover', 'pdf'],
      default: 'epub',
    },
    borrowedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    returnedAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'borrowed', 'returned', 'overdue', 'rejected'],
        message:
          'Status must be pending, borrowed, returned, overdue, or rejected',
      },
      default: 'borrowed',
      index: true,
    },
    renewalCount: {
      type: Number,
      default: 0,
      min: 0,
      max: [1, 'Loans can only be renewed once'],
    },
    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for user active loans and overdue audits
borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });

const Borrow = mongoose.model('Borrow', borrowSchema);

module.exports = Borrow;
