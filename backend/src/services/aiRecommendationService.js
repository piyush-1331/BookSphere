const axios = require('axios');
const { fastApiResponseSchema } = require('../schemas/recommendationSchemas');

class AiServiceError extends Error {
  constructor(message, code = 'AI_SERVICE_ERROR', statusCode = 502) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class AiServiceTimeoutError extends AiServiceError {
  constructor(message = 'AI recommendation service request timed out.') {
    super(message, 'AI_SERVICE_TIMEOUT', 504);
  }
}

class AiServiceUnavailableError extends AiServiceError {
  constructor(message = 'AI recommendation service is currently unreachable.') {
    super(message, 'AI_SERVICE_UNAVAILABLE', 503);
  }
}

class AiServiceInvalidResponseError extends AiServiceError {
  constructor(message = 'AI recommendation service returned an invalid or malformed response.') {
    super(message, 'AI_SERVICE_INVALID_RESPONSE', 502);
  }
}

/**
 * Dispatches recommendation payload to the Python FastAPI microservice.
 *
 * @param {object} payload - { preferences, borrowed_books, favorite_books, candidate_books, limit, prefer_available }
 * @param {number} timeoutMs - Max execution time before throwing timeout
 * @returns {Promise<object>} Validated FastAPI response
 */
const fetchRecommendationsFromFastAPI = async (payload, timeoutMs = null) => {
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
  const serviceToken = process.env.AI_SERVICE_TOKEN;

  if (!serviceToken) {
    throw new AiServiceError(
      'AI service authentication credentials are not configured on backend.',
      'AI_SERVICE_CONFIG_ERROR',
      500
    );
  }

  const configuredTimeout = parseInt(process.env.FASTAPI_TIMEOUT_MS, 10) || 5000;
  const effectiveTimeout = typeof timeoutMs === 'number' ? timeoutMs : configuredTimeout;

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/recommendations`;

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceToken}`,
        'X-AI-Service-Token': serviceToken,
      },
      timeout: effectiveTimeout,
    });

    // 10. Validate the FastAPI response structure using Zod before forwarding to React
    const validation = fastApiResponseSchema.safeParse(response.data);
    if (!validation.success) {
      console.error('[AI Service Error] Response validation failed:', validation.error.format());
      throw new AiServiceInvalidResponseError(
        'AI recommendation service returned an unexpected response structure.'
      );
    }

    return validation.data;
  } catch (err) {
    // Re-throw our custom errors if already parsed
    if (err instanceof AiServiceError) {
      throw err;
    }

    // Axios timeout handling
    if (
      err.code === 'ECONNABORTED' ||
      err.code === 'ETIMEDOUT' ||
      err.message?.toLowerCase().includes('timeout')
    ) {
      throw new AiServiceTimeoutError(
        'The recommendation engine took too long to respond. Request timed out.'
      );
    }

    // Service connection failure handling
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new AiServiceUnavailableError(
        'The AI recommendation service is temporarily unavailable or unreachable.'
      );
    }

    // Non-200 HTTP status response from FastAPI
    if (err.response) {
      const status = err.response.status;
      let errorMsg = err.response.data?.detail?.error?.message;
      if (!errorMsg) {
        if (typeof err.response.data?.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (err.response.data?.detail) {
          errorMsg = JSON.stringify(err.response.data.detail);
        } else {
          errorMsg = `AI service returned HTTP error status ${status}`;
        }
      }
      throw new AiServiceError(errorMsg, 'AI_SERVICE_HTTP_ERROR', status >= 500 ? 502 : status);
    }

    throw new AiServiceError(
      err.message || 'An unexpected error occurred while communicating with the AI service.',
      'AI_SERVICE_COMMUNICATION_ERROR',
      502
    );
  }
};

/**
 * Fallback generator when FastAPI is unavailable and allowFallback is enabled.
 * Ranks candidate books by rating and available stock directly from MongoDB data.
 * Transparently flagged as a database catalog fallback (not fabricated AI).
 *
 * @param {Array<object>} candidates - Clean MongoDB catalog items
 * @param {number} limit - Max items
 * @returns {object} Formatted fallback response
 */
const getCatalogPopularFallback = (candidates = [], limit = 5) => {
  const sorted = [...candidates].sort((a, b) => {
    const aStock = a.availableCopies > 0 ? 1 : 0;
    const bStock = b.availableCopies > 0 ? 1 : 0;
    if (aStock !== bStock) return bStock - aStock;
    return (b.rating || 4.5) - (a.rating || 4.5);
  });

  const picks = sorted.slice(0, limit);

  return {
    success: true,
    total: picks.length,
    strategy: 'db_catalog_popular_fallback',
    is_personalized: false,
    is_fallback: true,
    disclaimer:
      'AI recommendation service is temporarily offline. Displaying curated popular catalog highlights directly from BookSphere library.',
    data: picks.map((b) => {
      const bookId = b._id ? b._id.toString() : (b.id ? b.id.toString() : '');
      return {
        book: {
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
          availableCopies: typeof b.availableCopies === 'number' ? b.availableCopies : 1,
          totalCopies: typeof b.totalCopies === 'number' ? b.totalCopies : 1,
          rating: typeof b.rating === 'number' ? b.rating : 4.5,
          coverImage: b.coverImage || null,
          status: b.status || 'available',
          formats: Array.isArray(b.formats) ? b.formats : ['epub'],
        },
        score: roundNumber(minMax((b.rating || 4.5) / 5.0, 0.5, 0.9)),
        reason:
          b.availableCopies > 0
            ? `Curated catalog highlight with ${b.availableCopies} copy(ies) in circulation (${b.rating || 4.5}★ rating).`
            : `Popular volume in ${b.category} (${b.rating || 4.5}★ community rating).`,
        matched_genre: b.genre,
        matched_category: b.category,
        matched_author: null,
        matched_keywords: null,
      };
    }),
  };
};

const minMax = (val, min, max) => Math.min(max, Math.max(min, val));
const roundNumber = (val) => Math.round(val * 1000) / 1000;

module.exports = {
  fetchRecommendationsFromFastAPI,
  getCatalogPopularFallback,
  AiServiceError,
  AiServiceTimeoutError,
  AiServiceUnavailableError,
  AiServiceInvalidResponseError,
};
