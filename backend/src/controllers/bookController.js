const Book = require('../models/Book');

/**
 * Escapes regex special characters to prevent ReDoS / injection
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Controller to fetch paginated, filtered, and sorted books
 * GET /api/books
 */
const getBooks = async (req, res, next) => {
  try {
    const {
      search,
      scope = 'general',
      title,
      genre,
      category,
      author,
      isbn,
      ISBN,
      availability,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};

    // 1. Text / Keyword Search with optional scope targeting
    if (search && search.trim() !== '') {
      const sanitizedSearch = escapeRegex(search.trim());
      const cleanScope = (scope || 'general').toLowerCase();

      if (cleanScope === 'title') {
        filter.title = { $regex: sanitizedSearch, $options: 'i' };
      } else if (cleanScope === 'author') {
        filter.author = { $regex: sanitizedSearch, $options: 'i' };
      } else if (cleanScope === 'isbn') {
        filter.ISBN = { $regex: sanitizedSearch, $options: 'i' };
      } else if (cleanScope === 'category') {
        filter.category = { $regex: sanitizedSearch, $options: 'i' };
      } else if (cleanScope === 'genre') {
        filter.genre = { $regex: sanitizedSearch, $options: 'i' };
      } else {
        // General / All fields search
        filter.$or = [
          { title: { $regex: sanitizedSearch, $options: 'i' } },
          { author: { $regex: sanitizedSearch, $options: 'i' } },
          { ISBN: { $regex: sanitizedSearch, $options: 'i' } },
          { category: { $regex: sanitizedSearch, $options: 'i' } },
          { genre: { $regex: sanitizedSearch, $options: 'i' } },
          { description: { $regex: sanitizedSearch, $options: 'i' } },
        ];
      }
    }

    // 2. Specific Title Search/Filter
    if (title && title.trim() !== '') {
      filter.title = { $regex: escapeRegex(title.trim()), $options: 'i' };
    }

    // 3. Author Filter
    if (author && author.trim() !== '') {
      filter.author = { $regex: escapeRegex(author.trim()), $options: 'i' };
    }

    // 4. ISBN Filter
    const isbnQuery = isbn || ISBN;
    if (isbnQuery && isbnQuery.trim() !== '') {
      filter.ISBN = { $regex: escapeRegex(isbnQuery.trim()), $options: 'i' };
    }

    // 5. Genre Filter
    if (genre && genre.trim() !== '' && genre.toLowerCase() !== 'all') {
      filter.genre = { $regex: escapeRegex(genre.trim()), $options: 'i' };
    }

    // 6. Category Filter
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      filter.category = {
        $regex: escapeRegex(category.trim()),
        $options: 'i',
      };
    }

    // 5. Availability Filter
    if (availability) {
      const availLower = availability.toLowerCase();
      if (availLower === 'true' || availLower === 'available') {
        filter.availableCopies = { $gt: 0 };
      } else if (availLower === 'false' || availLower === 'unavailable') {
        filter.availableCopies = 0;
      }
    }

    // 6. Pagination & Sorting Setup
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortCriteria = { [sortBy]: sortDirection };

    // Secondary sort for stable ordering
    if (sortBy !== '_id') {
      sortCriteria._id = sortDirection;
    }

    // Execute query and total count in parallel
    const [books, total] = await Promise.all([
      Book.find(filter)
        .select('-__v')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Book.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: books,
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
 * Controller to fetch a single book by ID
 * GET /api/books/:id
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id).select('-__v').lean();

    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: `Book with ID "${id}" was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
};
