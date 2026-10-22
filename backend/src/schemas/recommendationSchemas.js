const { z } = require('zod');

/**
 * Client request schema for POST /api/recommendations
 */
const recommendationRequestSchema = z
  .object({
    limit: z.coerce
      .number()
      .int('Limit must be an integer')
      .min(1, 'Limit must be at least 1')
      .max(20, 'Limit cannot exceed 20')
      .default(5),
    preferAvailable: z.boolean().default(true),
    allowFallback: z.boolean().default(false),
    preferences: z
      .object({
        favorite_genres: z.array(z.string().trim()).default([]),
        favorite_categories: z.array(z.string().trim()).default([]),
        favorite_authors: z.array(z.string().trim()).default([]),
      })
      .default({
        favorite_genres: [],
        favorite_categories: [],
        favorite_authors: [],
      }),
  })
  .default({});

/**
 * Zod validation schema for FastAPI response validation.
 * Verifies that the internal microservice returned an authentic, well-formed payload
 * before serving it downstream to React.
 */
const fastApiBookItemSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    title: z.string(),
    author: z.string(),
    genre: z.string(),
    category: z.string(),
    description: z.string().optional().default(''),
    ISBN: z.string().nullable().optional(),
    publicationYear: z.number().int().nullable().optional(),
    publisher: z.string().nullable().optional(),
    availableCopies: z.number().int().optional().default(1),
    totalCopies: z.number().int().optional().default(1),
    rating: z.number().optional().default(4.5),
    coverImage: z.string().nullable().optional(),
    status: z.string().optional().default('available'),
    formats: z.array(z.string()).optional().default([]),
  })
  .transform((b) => {
    const id = b.id || b._id || '';
    return {
      ...b,
      id,
      _id: id,
    };
  });

const fastApiRecommendationItemSchema = z.object({
  book: fastApiBookItemSchema,
  score: z.number().min(0).max(1),
  reason: z.string(),
  matched_genre: z.string().nullable().optional(),
  matched_category: z.string().nullable().optional(),
  matched_author: z.string().nullable().optional(),
  matched_keywords: z.array(z.string()).nullable().optional(),
});

const fastApiResponseSchema = z.object({
  success: z.boolean(),
  total: z.number().int(),
  strategy: z.string(),
  is_personalized: z.boolean(),
  disclaimer: z.string().optional(),
  data: z.array(fastApiRecommendationItemSchema),
});

module.exports = {
  recommendationRequestSchema,
  fastApiResponseSchema,
};
