const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const { isLoanOverdue } = require('../services/overdueService');

/**
 * Controller to borrow a book
 * POST /api/borrows
 */
const borrowBook = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookId, durationDays = 14, format = 'epub', notes } = req.body;

    // 1 & 2. Atomically check availability and decrement availableCopies
    // Using atomic condition { availableCopies: { $gt: 0 } } ensures no race condition
    // can ever drive availableCopies below 0.
    const book = await Book.findOneAndUpdate(
      {
        _id: bookId,
        availableCopies: { $gt: 0 },
      },
      {
        $inc: { availableCopies: -1 },
      },
      { returnDocument: 'after' }
    );

    // If no book was matched, determine why (non-existent vs out of stock)
    if (!book) {
      const bookExists = await Book.findById(bookId);
      if (!bookExists) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOK_NOT_FOUND',
            message: `Book with ID "${bookId}" does not exist.`,
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_COPIES_AVAILABLE',
          message:
            'All copies of this volume are currently on loan. Please place a hold or check back later.',
        },
      });
    }

    // Update book status if all copies are exhausted
    if (book.availableCopies === 0 && book.status === 'available') {
      await Book.findByIdAndUpdate(bookId, { $set: { status: 'borrowed' } });
    }

    // 3. Calculate timestamps & due date
    const borrowedAt = new Date();
    const duration = parseInt(durationDays, 10) || 14;
    const dueDate = new Date(
      borrowedAt.getTime() + duration * 24 * 60 * 60 * 1000
    );

    // 4. Create the Borrow record
    const borrow = await Borrow.create({
      user: userId,
      book: bookId,
      format,
      borrowedAt,
      dueDate,
      status: 'borrowed',
      notes: notes || '',
    });

    // Populate book details for clean client response
    await borrow.populate({
      path: 'book',
      select:
        'title author ISBN coverImage category genre shelfLocation formats',
    });

    res.status(201).json({
      success: true,
      message: `Successfully checked out "${book.title}". Due date: ${dueDate.toISOString().split('T')[0]}.`,
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch authenticated user's borrowings
 * GET /api/borrows/my
 */
const getMyBorrows = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'borrowedAt',
      order = 'desc',
    } = req.query;

    const filter = { user: userId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = order === 'asc' ? 1 : -1;

    const [borrows, total] = await Promise.all([
      Borrow.find(filter)
        .populate({
          path: 'book',
          select:
            'title author ISBN coverImage category genre availableCopies totalCopies formats rating',
        })
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Borrow.countDocuments(filter),
    ]);

    // Annotate virtual isOverdue flag without silently mutating DB during GET
    const enrichedBorrows = borrows.map((b) => ({
      ...b,
      isOverdue: isLoanOverdue(b),
    }));

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: enrichedBorrows,
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

/**
 * Controller to fetch a single borrow record by ID
 * GET /api/borrows/:id
 */
const getBorrowById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const borrow = await Borrow.findById(id)
      .populate({
        path: 'book',
        select:
          'title author ISBN coverImage category genre availableCopies totalCopies shelfLocation',
      })
      .populate({
        path: 'user',
        select: 'name email profile.cardId profile.branch',
      });

    if (!borrow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BORROW_NOT_FOUND',
          message: `Borrow record with ID "${id}" was not found.`,
        },
      });
    }

    // Enforce ownership: only the borrower or an administrator can view
    const isOwner = borrow.user._id.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this borrowing record.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...borrow.toJSON(),
        isOverdue: isLoanOverdue(borrow),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to return a borrowed book
 * PATCH /api/borrows/:id/return
 */
const returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // 1. Fetch borrow record
    const borrow = await Borrow.findById(id);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BORROW_NOT_FOUND',
          message: `Borrow record with ID "${id}" was not found.`,
        },
      });
    }

    // 2. Verify ownership (borrower or admin)
    const isOwner = borrow.user.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to return this loan record.',
        },
      });
    }

    // 3. Verify the loan is active (prevent returning twice)
    if (borrow.status === 'returned') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BOOK_ALREADY_RETURNED',
          message: `This volume was already returned on ${
            borrow.returnedAt
              ? new Date(borrow.returnedAt).toISOString().split('T')[0]
              : 'a previous date'
          }.`,
        },
      });
    }

    // 4. Mark borrow record as returned atomically
    const returnedAt = new Date();
    borrow.status = 'returned';
    borrow.returnedAt = returnedAt;
    await borrow.save();

    // 5. Increment availableCopies on the Book atomically
    const updatedBook = await Book.findByIdAndUpdate(
      borrow.book,
      {
        $inc: { availableCopies: 1 },
        $set: { status: 'available' },
      },
      { returnDocument: 'after' }
    );

    // Populate book info for response
    await borrow.populate({
      path: 'book',
      select: 'title author ISBN coverImage category genre availableCopies',
    });

    res.status(200).json({
      success: true,
      message: `Volume "${
        updatedBook ? updatedBook.title : 'Book'
      }" successfully returned and restored to circulation.`,
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list all borrow records (Admin only)
 * GET /api/borrows
 */
const getAllBorrows = async (req, res, next) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'borrowedAt',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = order === 'asc' ? 1 : -1;

    const [borrows, total] = await Promise.all([
      Borrow.find(filter)
        .populate({
          path: 'book',
          select:
            'title author ISBN coverImage category genre availableCopies totalCopies formats rating',
        })
        .populate({
          path: 'user',
          select: 'name email role profile',
        })
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Borrow.countDocuments(filter),
    ]);

    const enrichedBorrows = borrows.map((b) => ({
      ...b,
      isOverdue: isLoanOverdue(b),
    }));

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: enrichedBorrows,
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

/**
 * Controller to approve a pending borrow request (Admin only)
 * PATCH /api/borrows/:id/approve
 */
const approveBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;

    const borrow = await Borrow.findById(id).populate('book');
    if (!borrow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BORROW_NOT_FOUND',
          message: `Borrow record with ID "${id}" was not found.`,
        },
      });
    }

    if (borrow.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot approve loan with status "${borrow.status}". Only pending loans can be approved.`,
        },
      });
    }

    // Check available copies
    const book = await Book.findById(borrow.book._id || borrow.book);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_COPIES_AVAILABLE',
          message: 'Cannot approve loan because no copies are currently available in the catalog.',
        },
      });
    }

    // Decrement available copies
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    if (book.availableCopies === 0 && book.status === 'available') {
      book.status = 'borrowed';
    }
    await book.save();

    borrow.status = 'borrowed';
    borrow.borrowedAt = new Date();
    borrow.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await borrow.save();

    await borrow.populate({
      path: 'user',
      select: 'name email role profile',
    });

    res.status(200).json({
      success: true,
      message: `Borrow request for "${book.title}" has been approved.`,
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to reject a borrow request (Admin only)
 * PATCH /api/borrows/:id/reject
 */
const rejectBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const borrow = await Borrow.findById(id).populate('book');
    if (!borrow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BORROW_NOT_FOUND',
          message: `Borrow record with ID "${id}" was not found.`,
        },
      });
    }

    if (borrow.status === 'returned' || borrow.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot reject loan that is already "${borrow.status}".`,
        },
      });
    }

    // If borrow was active ('borrowed' or 'overdue') and being rejected/cancelled by admin,
    // restore the available copy
    if (borrow.status === 'borrowed' || borrow.status === 'overdue') {
      await Book.findByIdAndUpdate(borrow.book._id || borrow.book, {
        $inc: { availableCopies: 1 },
        $set: { status: 'available' },
      });
    }

    borrow.status = 'rejected';
    if (reason) {
      borrow.notes = borrow.notes ? `${borrow.notes} | Rejected: ${reason}` : `Rejected: ${reason}`;
    }
    await borrow.save();

    await borrow.populate({
      path: 'user',
      select: 'name email role profile',
    });

    res.status(200).json({
      success: true,
      message: 'Borrow request has been rejected.',
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  borrowBook,
  getMyBorrows,
  getBorrowById,
  returnBook,
  getAllBorrows,
  approveBorrow,
  rejectBorrow,
};
