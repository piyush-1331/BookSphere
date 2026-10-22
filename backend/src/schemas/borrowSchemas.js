const { z } = require('zod');
const { OBJECT_ID_REGEX } = require('./bookSchemas');

/**
 * Zod schema for POST /api/borrows
 */
const createBorrowSchema = z.object({
  bookId: z
    .string({ required_error: 'Book ID is required' })
    .trim()
    .regex(
      OBJECT_ID_REGEX,
      'Invalid book ID format. Must be a valid 24-character hexadecimal ObjectId.'
    ),
  durationDays: z.coerce
    .number()
    .int('Duration must be an integer number of days')
    .min(1, 'Duration must be at least 1 day')
    .max(30, 'Duration cannot exceed 30 days')
    .default(14),
  format: z
    .enum(['epub', 'audiobook', 'hardcover', 'pdf'], {
      errorMap: () => ({ message: 'Format must be epub, audiobook, hardcover, or pdf' }),
    })
    .default('epub'),
  notes: z.string().trim().max(300).optional(),
});

/**
 * Zod schema for validating :id parameter in borrows
 */
const borrowParamSchema = z.object({
  id: z
    .string({ required_error: 'Borrow record ID is required' })
    .trim()
    .regex(
      OBJECT_ID_REGEX,
      'Invalid borrow ID format. Must be a valid 24-character hexadecimal ObjectId.'
    ),
});

/**
 * Zod schema for GET /api/borrows/my query parameters
 */
const borrowQuerySchema = z.object({
  status: z
    .enum(['borrowed', 'returned', 'overdue', 'pending', 'rejected', 'all'])
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
    .enum(['borrowedAt', 'dueDate', 'returnedAt', 'status'])
    .default('borrowedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = {
  createBorrowSchema,
  borrowParamSchema,
  borrowQuerySchema,
};
