const Favorite = require('../models/Favorite');
const Book = require('../models/Book');

/**
 * Controller to fetch all favorites for the authenticated user
 * GET /api/favorites
 */
const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'book',
        select:
          'title author ISBN coverImage category genre availableCopies totalCopies rating formats publishedYear publisher status',
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to add a book to the authenticated user's favorites
 * POST /api/favorites/:bookId
 */
const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookId } = req.params;
    const { notes } = req.body || {};

    // 1. Verify that the book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: `Book with ID "${bookId}" does not exist.`,
        },
      });
    }

    // 2. Check for duplicate favorite entry
    const existingFavorite = await Favorite.findOne({
      user: userId,
      book: bookId,
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_FAVORITED',
          message: 'This book is already in your favorites shelf.',
        },
      });
    }

    // 3. Create favorite
    const favorite = await Favorite.create({
      user: userId,
      book: bookId,
      notes: notes || '',
    });

    await favorite.populate({
      path: 'book',
      select:
        'title author ISBN coverImage category genre availableCopies totalCopies rating formats',
    });

    res.status(201).json({
      success: true,
      message: `"${book.title}" added to your favorites shelf.`,
      data: favorite,
    });
  } catch (error) {
    // Catch duplicate key error defensively
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_FAVORITED',
          message: 'This book is already in your favorites shelf.',
        },
      });
    }
    next(error);
  }
};

/**
 * Controller to remove a book from the authenticated user's favorites
 * DELETE /api/favorites/:bookId
 */
const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookId } = req.params;

    const deletedFavorite = await Favorite.findOneAndDelete({
      user: userId,
      book: bookId,
    });

    if (!deletedFavorite) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FAVORITE_NOT_FOUND',
          message: 'This book was not found in your favorites shelf.',
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Book successfully removed from your favorites shelf.',
      data: {
        bookId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
