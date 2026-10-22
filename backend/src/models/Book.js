const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [100, 'Author cannot exceed 100 characters'],
      index: true,
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
        'Please provide a valid ISBN-10 or ISBN-13',
      ],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      min: [1400, 'Publication year cannot be earlier than 1400'],
      max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future'],
      index: true,
    },
    publisher: {
      type: String,
      required: [true, 'Publisher is required'],
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image URL is required'],
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies count is required'],
      min: [1, 'Total copies must be at least 1'],
      default: 5,
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies count is required'],
      min: [0, 'Available copies cannot be negative'],
      default: 5,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'borrowed', 'reserved', 'maintenance', 'archived'],
        message: 'Status must be available, borrowed, reserved, maintenance, or archived',
      },
      default: 'available',
      index: true,
    },
    formats: {
      type: [String],
      enum: ['epub', 'audiobook', 'hardcover', 'pdf'],
      default: ['epub', 'hardcover'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    pageCount: {
      type: Number,
      default: 320,
    },
    fileSize: {
      type: String,
      default: '12.5 MB',
    },
    shelfLocation: {
      type: String,
      default: 'GENERAL-STACKS',
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

// Compound text index for global search
bookSchema.index(
  {
    title: 'text',
    author: 'text',
    description: 'text',
    genre: 'text',
    category: 'text',
  },
  {
    weights: {
      title: 10,
      author: 5,
      genre: 3,
      category: 3,
      description: 1,
    },
    default_language: 'english',
    language_override: 'textSearchLanguage',
    name: 'book_text_search_index',
  }
);

// Compound index for filtering & sorting performance
bookSchema.index({ category: 1, availableCopies: 1 });
bookSchema.index({ genre: 1, rating: -1 });

// Pre-save hook to ensure availableCopies does not exceed totalCopies
bookSchema.pre('save', function () {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  // Auto update status based on available copies
  if (this.availableCopies === 0 && this.status === 'available') {
    this.status = 'borrowed';
  } else if (this.availableCopies > 0 && this.status === 'borrowed') {
    this.status = 'available';
  }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
