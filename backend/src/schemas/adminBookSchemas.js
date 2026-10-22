const { z } = require('zod');
const { OBJECT_ID_REGEX } = require('./bookSchemas');

const ISBN_REGEX =
  /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

const preprocessBookInput = (val) => {
  if (val && typeof val === 'object') {
    const copy = { ...val };
    if (!copy.ISBN && copy.isbn) copy.ISBN = copy.isbn;
    if (copy.publicationYear === undefined && copy.publishedYear !== undefined) {
      copy.publicationYear = copy.publishedYear;
    }
    if (!copy.publisher) copy.publisher = 'BookSphere Academic Editions';
    if (!copy.category) copy.category = copy.genre || 'General';
    return copy;
  }
  return val;
};

/**
 * Zod schema for POST /api/admin/books (Create new book)
 */
const createBookBaseSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters'),
    author: z
      .string({ required_error: 'Author is required' })
      .trim()
      .min(1, 'Author cannot be empty')
      .max(100, 'Author cannot exceed 100 characters'),
    ISBN: z
      .string({ required_error: 'ISBN is required' })
      .trim()
      .regex(ISBN_REGEX, 'Please provide a valid ISBN-10 or ISBN-13 format'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(3000, 'Description cannot exceed 3000 characters'),
    genre: z
      .string({ required_error: 'Genre is required' })
      .trim()
      .min(1, 'Genre cannot be empty'),
    category: z
      .string({ required_error: 'Category is required' })
      .trim()
      .min(1, 'Category cannot be empty'),
    publicationYear: z.coerce
      .number({ required_error: 'Publication year is required' })
      .int()
      .min(1400, 'Publication year cannot be earlier than 1400')
      .max(new Date().getFullYear() + 1, 'Publication year cannot be in the future'),
    publisher: z
      .string({ required_error: 'Publisher is required' })
      .trim()
      .min(1, 'Publisher cannot be empty'),
    language: z.string().trim().default('English'),
    coverImage: z
      .string({ required_error: 'Cover image URL is required' })
      .trim()
      .url('Cover image must be a valid URL'),
    totalCopies: z.coerce
      .number({ required_error: 'Total copies is required' })
      .int()
      .min(1, 'Total copies must be at least 1')
      .default(5),
    availableCopies: z.coerce.number().int().min(0).optional(),
    status: z
      .enum(['available', 'borrowed', 'reserved', 'maintenance', 'archived'])
      .default('available'),
    formats: z
      .array(z.enum(['epub', 'audiobook', 'hardcover', 'pdf']))
      .min(1, 'At least one lending format is required')
      .default(['epub', 'hardcover']),
    rating: z.coerce.number().min(0).max(5).default(4.5),
    pageCount: z.coerce.number().int().min(1).default(300),
    fileSize: z.string().trim().default('12.0 MB'),
    shelfLocation: z.string().trim().default('GENERAL-STACKS'),
  })
  .refine(
    (data) => {
      if (
        data.availableCopies !== undefined &&
        data.availableCopies > data.totalCopies
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Available copies cannot exceed total copies',
      path: ['availableCopies'],
    }
  );

const createBookSchema = z.preprocess(preprocessBookInput, createBookBaseSchema);

/**
 * Zod schema for PATCH /api/admin/books/:id (Update book)
 */
const updateBookBaseSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    author: z.string().trim().min(1).max(100).optional(),
    ISBN: z.string().trim().regex(ISBN_REGEX).optional(),
    description: z.string().trim().min(10).max(3000).optional(),
    genre: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    publicationYear: z.coerce
      .number()
      .int()
      .min(1400)
      .max(new Date().getFullYear() + 1)
      .optional(),
    publisher: z.string().trim().min(1).optional(),
    language: z.string().trim().optional(),
    coverImage: z.string().trim().url().optional(),
    totalCopies: z.coerce.number().int().min(1).optional(),
    availableCopies: z.coerce.number().int().min(0).optional(),
    status: z
      .enum(['available', 'borrowed', 'reserved', 'maintenance', 'archived'])
      .optional(),
    formats: z
      .array(z.enum(['epub', 'audiobook', 'hardcover', 'pdf']))
      .min(1)
      .optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    pageCount: z.coerce.number().int().min(1).optional(),
    fileSize: z.string().trim().optional(),
    shelfLocation: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (
        data.availableCopies !== undefined &&
        data.totalCopies !== undefined &&
        data.availableCopies > data.totalCopies
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Available copies cannot exceed total copies',
      path: ['availableCopies'],
    }
  );

const updateBookSchema = z.preprocess(preprocessBookInput, updateBookBaseSchema);

/**
 * Zod schema for validating admin book ID parameter
 */
const adminBookParamSchema = z.object({
  id: z
    .string({ required_error: 'Book ID is required' })
    .trim()
    .regex(
      OBJECT_ID_REGEX,
      'Invalid book ID format. Must be a valid 24-character hexadecimal ObjectId.'
    ),
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  adminBookParamSchema,
};

