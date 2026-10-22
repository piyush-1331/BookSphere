const { z } = require('zod');
const { OBJECT_ID_REGEX } = require('./bookSchemas');

/**
 * Zod schema for validating :bookId parameter in favorites
 */
const favoriteParamSchema = z.object({
  bookId: z
    .string({ required_error: 'Book ID is required' })
    .trim()
    .regex(
      OBJECT_ID_REGEX,
      'Invalid book ID format. Must be a valid 24-character hexadecimal ObjectId.'
    ),
});

/**
 * Zod schema for optional notes when adding a favorite
 */
const addFavoriteSchema = z.object({
  notes: z.string().trim().max(300, 'Notes cannot exceed 300 characters').optional(),
});

module.exports = {
  favoriteParamSchema,
  addFavoriteSchema,
};
