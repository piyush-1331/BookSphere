const { z } = require('zod');

// Regex for standard MongoDB 24-character hexadecimal ObjectId
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schema for GET /api/books query parameters
 */
const bookQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Search term cannot exceed 100 characters')
    .optional(),
  title: z.string().trim().max(100).optional(),
  genre: z.string().trim().max(50).optional(),
  category: z.string().trim().max(50).optional(),
  author: z.string().trim().max(100).optional(),
  isbn: z.string().trim().max(50).optional(),
  ISBN: z.string().trim().max(50).optional(),
  scope: z
    .enum(['all', 'general', 'title', 'author', 'isbn', 'category', 'genre'])
    .optional(),
  availability: z
    .enum(['true', 'false', 'available', 'unavailable', 'all'])
    .optional(),
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sortBy: z
    .enum([
      'title',
      'author',
      'publicationYear',
      'availableCopies',
      'rating',
      'createdAt',
    ])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Validation schema for GET /api/books/:id route parameter
 */
const bookIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(
      OBJECT_ID_REGEX,
      'Invalid book ID format. Must be a valid 24-character hexadecimal ObjectId.'
    ),
});

module.exports = {
  bookQuerySchema,
  bookIdParamSchema,
  OBJECT_ID_REGEX,
};
