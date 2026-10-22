const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const { syncOverdueLoans } = require('../services/overdueService');

/**
 * Controller to add a new book to catalog (Admin)
 * POST /api/admin/books
 */
const createBook = async (req, res, next) => {
  try {
    const bookData = req.body;

    // Check if ISBN is already cataloged
    const existingBook = await Book.findOne({ ISBN: bookData.ISBN });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ISBN_ALREADY_EXISTS',
          message: `A book volume with ISBN "${bookData.ISBN}" is already cataloged.`,
        },
      });
    }

    // Default availableCopies to totalCopies if omitted
    if (bookData.availableCopies === undefined) {
      bookData.availableCopies = bookData.totalCopies;
    }

    const newBook = await Book.create(bookData);

    res.status(201).json({
      success: true,
      message: `Book "${newBook.title}" successfully registered in catalog.`,
      data: newBook,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ISBN_ALREADY_EXISTS',
          message: 'A book with this ISBN already exists.',
        },
      });
    }
    next(error);
  }
};

/**
 * Controller to edit an existing book (Admin)
 * PATCH /api/admin/books/:id
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: `Book with ID "${id}" was not found.`,
        },
      });
    }

    // Check ISBN collision if ISBN is being altered
    if (updates.ISBN && updates.ISBN !== book.ISBN) {
      const collision = await Book.findOne({ ISBN: updates.ISBN });
      if (collision) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ISBN_ALREADY_EXISTS',
            message: `Another cataloged volume already uses ISBN "${updates.ISBN}".`,
          },
        });
      }
    }

    // Validate copy counts
    const newTotal =
      updates.totalCopies !== undefined ? updates.totalCopies : book.totalCopies;
    const newAvailable =
      updates.availableCopies !== undefined
        ? updates.availableCopies
        : book.availableCopies;

    if (newAvailable > newTotal) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COPY_COUNT',
          message: `Available copies (${newAvailable}) cannot exceed total copies (${newTotal}).`,
        },
      });
    }

    // Apply updates
    Object.assign(book, updates);
    await book.save();

    res.status(200).json({
      success: true,
      message: `Book "${book.title}" updated successfully.`,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to safely deactivate/delete a book (Admin)
 * DELETE /api/admin/books/:id
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: `Book with ID "${id}" was not found.`,
        },
      });
    }

    // Check if there are active loans in circulation
    const activeLoansCount = await Borrow.countDocuments({
      book: id,
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (activeLoansCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ACTIVE_LOANS_EXIST',
          message: `Cannot delete "${book.title}" because there are currently ${activeLoansCount} active or overdue loans in circulation. You may update its status to "archived" instead.`,
        },
      });
    }

    // Perform deletion
    await Book.findByIdAndDelete(id);

    // Clean up any orphaned favorites
    await Favorite.deleteMany({ book: id });

    res.status(200).json({
      success: true,
      message: `Book "${book.title}" successfully deleted from catalog.`,
      data: {
        id,
        title: book.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to trigger overdue loans audit and status synchronization (Admin)
 * POST /api/admin/circulation/audit-overdue
 */
const auditOverdueLoans = async (req, res, next) => {
  try {
    const auditResult = await syncOverdueLoans();

    res.status(200).json({
      success: true,
      message: `Overdue loans audit completed. ${auditResult.updatedCount} loan(s) transitioned to overdue status.`,
      data: auditResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch comprehensive admin dashboard metrics and recent circulation
 * GET /api/admin/books/dashboard/stats
 */
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [
      totalBooks,
      totalUsers,
      activeBorrowings,
      overdueLoans,
      availableBooksCount,
      recentActivity,
    ] = await Promise.all([
      // Total books cataloged
      Book.countDocuments(),
      // Total registered patrons/users
      User.countDocuments(),
      // Active borrowings (status borrowed or overdue)
      Borrow.countDocuments({ status: { $in: ['borrowed', 'overdue'] } }),
      // Overdue borrowings
      Borrow.countDocuments({ status: 'overdue' }),
      // Available books (titles that currently have copies available)
      Book.countDocuments({ availableCopies: { $gt: 0 }, status: { $ne: 'archived' } }),
      // Recent borrowing activity
      Borrow.find()
        .sort({ borrowedAt: -1, createdAt: -1 })
        .limit(10)
        .populate({
          path: 'book',
          select: 'title author ISBN coverImage category genre availableCopies totalCopies',
        })
        .populate({
          path: 'user',
          select: 'name email role profile',
        })
        .lean(),
    ]);

    // Also get sum of all available copies across catalog
    const copyAgg = await Book.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      {
        $group: {
          _id: null,
          totalAvailableCopies: { $sum: '$availableCopies' },
          totalCopies: { $sum: '$totalCopies' },
        },
      },
    ]);
    const totalAvailableCopies = copyAgg[0]?.totalAvailableCopies || 0;

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        activeBorrowings,
        overdueBooks: overdueLoans,
        availableBooks: availableBooksCount,
        totalAvailableCopies,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBook,
  updateBook,
  deleteBook,
  auditOverdueLoans,
  getAdminDashboardStats,
};
