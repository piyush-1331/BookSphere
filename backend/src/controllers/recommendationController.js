const Favorite = require('../models/Favorite');
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const {
  fetchRecommendationsFromFastAPI,
  getCatalogPopularFallback,
  AiServiceError,
} = require('../services/aiRecommendationService');

/**
 * Maps a Mongoose Book document / lean object into a clean BookItem payload for FastAPI
 * @param {object} b - Book object
 * @returns {object} Formatted BookItem
 */
const formatBookForAI = (b) => {
  if (!b) return null;
  const bookId = b._id ? b._id.toString() : (b.id ? b.id.toString() : null);
  if (!bookId || !b.title || !b.author || !b.genre || !b.category) {
    return null;
  }
  return {
    id: bookId,
    _id: bookId,
    title: b.title,
    author: b.author,
    genre: b.genre,
    category: b.category,
    description: b.description || '',
    ISBN: b.ISBN || null,
    publicationYear: typeof b.publicationYear === 'number' ? b.publicationYear : null,
    publisher: b.publisher || null,
    coverImage: b.coverImage || null,
    availableCopies: typeof b.availableCopies === 'number' ? b.availableCopies : 1,
    totalCopies: typeof b.totalCopies === 'number' ? b.totalCopies : 1,
    rating: typeof b.rating === 'number' ? b.rating : 4.5,
    status: b.status || 'available',
    formats: Array.isArray(b.formats) ? b.formats : ['epub'],
  };
};

/**
 * Controller for POST /api/recommendations
 * Gathers user reading context (favorites, borrows, preferences) and catalog candidates,
 * calls the Python FastAPI AI recommendation service, and returns validated recommendations.
 */
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      limit = 5,
      preferAvailable = true,
      allowFallback = false,
      preferences = {},
    } = req.body || {};

    // 1. Fetch user favorites and borrows in parallel
    const [userFavorites, userBorrows, candidateBooks] = await Promise.all([
      Favorite.find({ user: userId }).populate('book').lean(),
      Borrow.find({ user: userId }).populate('book').lean(),
      Book.find({ status: { $ne: 'archived' } }).select('-__v').limit(100).lean(),
    ]);

    // Format historical items and filter out deleted/null references
    const favoriteBooks = userFavorites
      .map((f) => formatBookForAI(f.book))
      .filter(Boolean);

    const borrowedBooks = userBorrows
      .map((b) => formatBookForAI(b.book))
      .filter(Boolean);

    const formattedCandidates = candidateBooks
      .map(formatBookForAI)
      .filter(Boolean);

    // Merge preferences: declared in request body or stored in user account/profile
    const userPrefs = req.user?.preferences || req.user?.profile?.preferences || {};
    const mergedPreferences = {
      favorite_genres: [
        ...new Set([
          ...(Array.isArray(userPrefs.favorite_genres) ? userPrefs.favorite_genres : []),
          ...(Array.isArray(preferences.favorite_genres) ? preferences.favorite_genres : []),
        ]),
      ],
      favorite_categories: [
        ...new Set([
          ...(Array.isArray(userPrefs.favorite_categories) ? userPrefs.favorite_categories : []),
          ...(Array.isArray(preferences.favorite_categories) ? preferences.favorite_categories : []),
        ]),
      ],
      favorite_authors: [
        ...new Set([
          ...(Array.isArray(userPrefs.favorite_authors) ? userPrefs.favorite_authors : []),
          ...(Array.isArray(preferences.favorite_authors) ? preferences.favorite_authors : []),
        ]),
      ],
    };

    // 2. Build internal microservice request payload
    const fastApiPayload = {
      user_id: userId.toString(),
      preferences: mergedPreferences,
      borrowed_books: borrowedBooks,
      favorite_books: favoriteBooks,
      recently_viewed_books: [],
      candidate_books: formattedCandidates,
      exclude_previously_borrowed: true,
      prefer_available: Boolean(preferAvailable),
      limit: Math.min(20, Math.max(1, parseInt(limit, 10))),
    };

    try {
      // 3. Dispatch to FastAPI microservice with timeout
      const recommendationResponse = await fetchRecommendationsFromFastAPI(fastApiPayload);

      return res.status(200).json(recommendationResponse);
    } catch (aiError) {
      console.warn(`[AI Service Warn] Recommendation error: ${aiError.message}`);

      // 4. If FastAPI is unavailable/timed out and allowFallback is explicitly enabled,
      // return transparent, non-fabricated database catalog highlights
      if (allowFallback && formattedCandidates.length > 0) {
        const fallbackResult = getCatalogPopularFallback(
          formattedCandidates,
          limit
        );
        return res.status(200).json(fallbackResult);
      }

      // If fallback is disallowed (default), propagate structured error
      if (aiError instanceof AiServiceError) {
        return res.status(aiError.statusCode).json({
          success: false,
          error: {
            code: aiError.code,
            message: aiError.message,
          },
        });
      }

      throw aiError;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  formatBookForAI,
};
