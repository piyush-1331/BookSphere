const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test'; // Bypass rate limits and test-specific guards

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const axios = require('axios');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Borrow = require('../src/models/Borrow');
const Favorite = require('../src/models/Favorite');
const { generateToken } = require('../src/utils/token');

describe('BookSphere Express-to-FastAPI Recommendation Pipeline Test Suite', () => {
  const timestamp = Date.now();
  let originalAxiosPost = null;

  // Test users & tokens
  let patronUser = null;
  let patronToken = null;

  let emptyHistoryUser = null;
  let emptyHistoryToken = null;

  // Test books
  let book1 = null;
  let book2 = null;
  let book3 = null;

  // Test borrow & favorite records
  let testBorrow = null;
  let testFavorite = null;

  const generateValidISBN = () => {
    const g1 = Math.floor(1000 + Math.random() * 9000);
    const g2 = Math.floor(1000 + Math.random() * 9000);
    const check = Math.floor(Math.random() * 10);
    return `978-0-${g1}-${g2}-${check}`;
  };

  before(async () => {
    await connectDB();

    // 1. Create a Patron with rich reading history (borrows, favorites, preferences)
    patronUser = await User.create({
      name: 'Julian Vance',
      email: `julian_recs_${timestamp}@booksphere.org`,
      passwordHash: 'dummy_hash_for_test',
      role: 'user',
      preferences: {
        favorite_genres: ['Astrophysics', 'Cosmology'],
        favorite_categories: ['Science & Technology'],
        favorite_authors: ['Carl Sagan'],
      },
      profile: { cardId: `BSP-REC-${timestamp}`, branch: 'Central Library' },
    });
    patronToken = generateToken({
      id: patronUser._id.toString(),
      userId: patronUser._id.toString(),
      role: patronUser.role,
      email: patronUser.email,
    });

    // 2. Create a Patron with completely empty reading history
    emptyHistoryUser = await User.create({
      name: 'Nora Blank',
      email: `nora_empty_${timestamp}@booksphere.org`,
      passwordHash: 'dummy_hash_for_test',
      role: 'user',
      preferences: {
        favorite_genres: [],
        favorite_categories: [],
        favorite_authors: [],
      },
      profile: { cardId: `BSP-EMP-${timestamp}`, branch: 'North Campus' },
    });
    emptyHistoryToken = generateToken({
      id: emptyHistoryUser._id.toString(),
      userId: emptyHistoryUser._id.toString(),
      role: emptyHistoryUser.role,
      email: emptyHistoryUser.email,
    });

    // 3. Create Catalog Books
    book1 = await Book.create({
      title: 'Cosmos: The Grand Frontier',
      author: 'Carl Sagan',
      genre: 'Astrophysics',
      category: 'Science & Technology',
      ISBN: generateValidISBN(),
      description: 'A deep journey through cosmic scale and human exploration.',
      publicationYear: 1980,
      publisher: 'Random House',
      coverImage: 'https://images.unsplash.com/photo-cosmos.jpg',
      totalCopies: 5,
      availableCopies: 4,
      rating: 4.9,
      status: 'available',
    });

    book2 = await Book.create({
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      genre: 'Cosmology',
      category: 'Science & Technology',
      ISBN: generateValidISBN(),
      description: 'From the big bang to black holes and the nature of spacetime.',
      publicationYear: 1988,
      publisher: 'Bantam Books',
      coverImage: 'https://images.unsplash.com/photo-time.jpg',
      totalCopies: 4,
      availableCopies: 3,
      rating: 4.8,
      status: 'available',
    });

    book3 = await Book.create({
      title: 'Neuromancer',
      author: 'William Gibson',
      genre: 'Cyberpunk',
      category: 'Science Fiction',
      ISBN: generateValidISBN(),
      description: 'The seminal matrix cyberspace thriller.',
      publicationYear: 1984,
      publisher: 'Ace Books',
      coverImage: 'https://images.unsplash.com/photo-neuromancer.jpg',
      totalCopies: 3,
      availableCopies: 2,
      rating: 4.7,
      status: 'available',
    });

    // 4. Attach Borrow record to patronUser
    testBorrow = await Borrow.create({
      user: patronUser._id,
      book: book1._id,
      format: 'epub',
      borrowedAt: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'borrowed',
    });

    // 5. Attach Favorite record to patronUser
    testFavorite = await Favorite.create({
      user: patronUser._id,
      book: book2._id,
      notes: 'Essential physics reference',
    });
  });

  after(async () => {
    try {
      await User.deleteMany({
        _id: { $in: [patronUser?._id, emptyHistoryUser?._id].filter(Boolean) },
      });
      await Book.deleteMany({
        _id: { $in: [book1?._id, book2?._id, book3?._id].filter(Boolean) },
      });
      await Borrow.deleteMany({
        _id: { $in: [testBorrow?._id].filter(Boolean) },
      });
      await Favorite.deleteMany({
        _id: { $in: [testFavorite?._id].filter(Boolean) },
      });
    } catch (cleanupErr) {
      console.warn('Test cleanup warning:', cleanupErr.message);
    }
    await disconnectDB();
  });

  beforeEach(() => {
    originalAxiosPost = axios.post;
  });

  afterEach(() => {
    if (originalAxiosPost) {
      axios.post = originalAxiosPost;
    }
  });

  // 1. UNAUTHENTICATED REQUEST TEST
  describe('1. Unauthenticated Request Handling', () => {
    it('should reject unauthenticated POST /api/recommendations with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .send({ limit: 5 });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_REQUIRED');
      assert.ok(res.body.error.message.includes('Authentication token required'));
    });

    it('should reject request with an invalid or forged Bearer token', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', 'Bearer forged_tampered_token_xyz')
        .send({ limit: 5 });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'INVALID_TOKEN');
    });
  });

  // 2. AUTHENTICATED REQUEST & FASTAPI SUCCESS TEST
  describe('2. Authenticated Request & FastAPI Success Flow', () => {
    it('should gather user history (borrows, favorites, preferences) and catalog candidates, dispatch authenticated call to FastAPI, and return validated recommendations', async () => {
      let interceptedEndpoint = null;
      let interceptedHeaders = null;
      let interceptedPayload = null;

      // Mock axios.post to intercept call to FastAPI and return valid FastAPI response
      axios.post = async (url, payload, config) => {
        interceptedEndpoint = url;
        interceptedPayload = payload;
        interceptedHeaders = config?.headers;

        return {
          status: 200,
          data: {
            success: true,
            total: 1,
            strategy: 'personalized_content_similarity',
            is_personalized: true,
            disclaimer: 'PBL educational recommendation demo',
            data: [
              {
                book: {
                  id: book3._id.toString(),
                  _id: book3._id.toString(),
                  title: book3.title,
                  author: book3.author,
                  genre: book3.genre,
                  category: book3.category,
                  description: book3.description,
                  ISBN: book3.ISBN,
                  availableCopies: book3.availableCopies,
                  totalCopies: book3.totalCopies,
                  rating: book3.rating,
                  status: book3.status,
                  formats: ['epub'],
                },
                score: 0.94,
                reason: 'Matches your taste for speculative science fiction and technological themes.',
                matched_genre: 'Cyberpunk',
                matched_category: 'Science Fiction',
                matched_author: null,
                matched_keywords: ['cyberspace', 'matrix'],
              },
            ],
          },
        };
      };

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          limit: 5,
          preferAvailable: true,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.is_personalized, true);
      assert.strictEqual(res.body.strategy, 'personalized_content_similarity');
      assert.strictEqual(res.body.total, 1);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].book.title, 'Neuromancer');
      assert.strictEqual(res.body.data[0].score, 0.94);
      assert.ok(res.body.data[0].reason);

      // Verify internal security & protocol compliance
      const expectedBaseUrl = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
      assert.strictEqual(
        interceptedEndpoint,
        `${expectedBaseUrl.replace(/\/+$/, '')}/api/recommendations`
      );

      // Verify AI_SERVICE_TOKEN passed via Bearer and X-AI-Service-Token
      const configuredToken = process.env.AI_SERVICE_TOKEN;
      assert.strictEqual(interceptedHeaders.Authorization, `Bearer ${configuredToken}`);
      assert.strictEqual(interceptedHeaders['X-AI-Service-Token'], configuredToken);

      // Verify user reading history was correctly extracted from DB and packaged
      assert.strictEqual(interceptedPayload.user_id, patronUser._id.toString());
      assert.ok(Array.isArray(interceptedPayload.borrowed_books));
      assert.strictEqual(interceptedPayload.borrowed_books.length, 1);
      assert.strictEqual(interceptedPayload.borrowed_books[0].title, 'Cosmos: The Grand Frontier');

      assert.ok(Array.isArray(interceptedPayload.favorite_books));
      assert.strictEqual(interceptedPayload.favorite_books.length, 1);
      assert.strictEqual(interceptedPayload.favorite_books[0].title, 'A Brief History of Time');

      assert.ok(interceptedPayload.preferences.favorite_genres.includes('Astrophysics'));
      assert.ok(interceptedPayload.candidate_books.length >= 3);
    });

    it('should support HttpOnly cookie authentication seamlessly', async () => {
      axios.post = async () => ({
        status: 200,
        data: {
          success: true,
          total: 1,
          strategy: 'personalized_content_similarity',
          is_personalized: true,
          data: [
            {
              book: {
                id: book2._id.toString(),
                _id: book2._id.toString(),
                title: book2.title,
                author: book2.author,
                genre: book2.genre,
                category: book2.category,
              },
              score: 0.88,
              reason: 'Matches reading preferences.',
            },
          ],
        },
      });

      const res = await request(app)
        .post('/api/recommendations')
        .set('Cookie', [`token=${patronToken}`])
        .send({});

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });

  // 3. EMPTY USER HISTORY TEST
  describe('3. Empty User History Flow', () => {
    it('should correctly handle a new patron with zero borrows and zero favorites (cold-start)', async () => {
      let interceptedPayload = null;

      axios.post = async (url, payload) => {
        interceptedPayload = payload;
        return {
          status: 200,
          data: {
            success: true,
            total: 2,
            strategy: 'cold_start_popular',
            is_personalized: false,
            disclaimer: 'Cold start popular catalog highlights',
            data: [
              {
                book: {
                  id: book1._id.toString(),
                  _id: book1._id.toString(),
                  title: book1.title,
                  author: book1.author,
                  genre: book1.genre,
                  category: book1.category,
                  availableCopies: book1.availableCopies,
                  rating: book1.rating,
                },
                score: 0.98,
                reason: 'Community favorite with highest catalog rating.',
              },
              {
                book: {
                  id: book2._id.toString(),
                  _id: book2._id.toString(),
                  title: book2.title,
                  author: book2.author,
                  genre: book2.genre,
                  category: book2.category,
                  availableCopies: book2.availableCopies,
                  rating: book2.rating,
                },
                score: 0.96,
                reason: 'Popular high-circulation title across all categories.',
              },
            ],
          },
        };
      };

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${emptyHistoryToken}`)
        .send({ limit: 5 });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.is_personalized, false);
      assert.strictEqual(res.body.strategy, 'cold_start_popular');
      assert.strictEqual(res.body.data.length, 2);

      // Verify that Express accurately passed empty arrays for history
      assert.deepStrictEqual(interceptedPayload.borrowed_books, []);
      assert.deepStrictEqual(interceptedPayload.favorite_books, []);
      assert.deepStrictEqual(interceptedPayload.preferences.favorite_genres, []);
      assert.ok(interceptedPayload.candidate_books.length >= 3);
    });
  });

  // 4. FASTAPI TIMEOUT HANDLING TEST
  describe('4. FastAPI Request Timeout Handling', () => {
    it('should handle timeout when FastAPI is slow and return 504 Gateway Timeout (without fabricating AI recommendations)', async () => {
      // Simulate Axios ECONNABORTED timeout
      axios.post = async () => {
        const timeoutError = new Error('timeout of 5000ms exceeded');
        timeoutError.code = 'ECONNABORTED';
        throw timeoutError;
      };

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ limit: 5, allowFallback: false });

      assert.strictEqual(res.status, 504);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AI_SERVICE_TIMEOUT');
      assert.ok(res.body.error.message.includes('timed out'));
      assert.strictEqual(res.body.data, undefined); // Strictly no fabricated AI recommendations
    });
  });

  // 5. INVALID FASTAPI RESPONSE VALIDATION TEST
  describe('5. FastAPI Response Validation (Zod Schema Guard)', () => {
    it('should reject malformed or non-compliant FastAPI response with 502 Bad Gateway', async () => {
      // Simulate FastAPI returning malformed payload violating response schema
      axios.post = async () => ({
        status: 200,
        data: {
          success: 'not_a_boolean', // Invalid type
          strategy: 12345,          // Invalid type
          data: 'corrupted_string_instead_of_array', // Invalid type
        },
      });

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ limit: 5 });

      assert.strictEqual(res.status, 502);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AI_SERVICE_INVALID_RESPONSE');
      assert.ok(res.body.error.message.includes('unexpected response structure'));
    });

    it('should reject FastAPI response when recommended book items are missing required fields', async () => {
      axios.post = async () => ({
        status: 200,
        data: {
          success: true,
          total: 1,
          strategy: 'test',
          is_personalized: true,
          data: [
            {
              // Missing required 'book' object
              score: 0.9,
              reason: 'Missing book object',
            },
          ],
        },
      });

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ limit: 5 });

      assert.strictEqual(res.status, 502);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AI_SERVICE_INVALID_RESPONSE');
    });
  });

  // 6. FASTAPI UNAVAILABLE / CONNECTION FAILURE TEST
  describe('6. FastAPI Service Unavailability Handling', () => {
    it('should return 503 Service Unavailable when FastAPI microservice is offline or unreachable', async () => {
      axios.post = async () => {
        const netErr = new Error('connect ECONNREFUSED 127.0.0.1:8000');
        netErr.code = 'ECONNREFUSED';
        throw netErr;
      };

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ limit: 5, allowFallback: false });

      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AI_SERVICE_UNAVAILABLE');
      assert.ok(res.body.error.message.includes('unavailable or unreachable'));
    });
  });

  // 7. EXPLICIT DATABASE-BASED POPULAR FALLBACK TEST
  describe('7. Documented Database-Based Catalog Fallback', () => {
    it('should transparently fall back to database popular catalog highlights only when explicitly permitted (allowFallback: true)', async () => {
      // Simulate FastAPI offline
      axios.post = async () => {
        const connErr = new Error('connect ECONNREFUSED 127.0.0.1:8000');
        connErr.code = 'ECONNREFUSED';
        throw connErr;
      };

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          limit: 2,
          allowFallback: true, // Explicit opt-in
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.is_fallback, true);
      assert.strictEqual(res.body.is_personalized, false);
      assert.strictEqual(res.body.strategy, 'db_catalog_popular_fallback');
      assert.ok(res.body.disclaimer.includes('AI recommendation service is temporarily offline'));
      assert.strictEqual(res.body.data.length, 2);

      // Verify books are sourced from actual MongoDB records
      res.body.data.forEach((item) => {
        assert.ok(item.book.title);
        assert.ok(item.book.author);
        assert.ok(typeof item.score === 'number');
        assert.ok(item.reason);
      });
    });
  });

  // 8. SECURITY & INFORMATION LEAKAGE PREVENTIONS
  describe('8. Security & Secret Protection', () => {
    it('should never expose FASTAPI_BASE_URL or AI_SERVICE_TOKEN in Express response or headers', async () => {
      axios.post = async () => ({
        status: 200,
        data: {
          success: true,
          total: 1,
          strategy: 'test',
          is_personalized: true,
          data: [
            {
              book: {
                id: book1._id.toString(),
                _id: book1._id.toString(),
                title: book1.title,
                author: book1.author,
                genre: book1.genre,
                category: book1.category,
              },
              score: 0.9,
              reason: 'Test reason',
            },
          ],
        },
      });

      const res = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({});

      const responseString = JSON.stringify(res.body);
      const configuredToken = process.env.AI_SERVICE_TOKEN;

      assert.strictEqual(responseString.includes(configuredToken), false);
      assert.strictEqual(responseString.includes('FASTAPI_BASE_URL'), false);

      // Verify response headers do not leak internal tokens
      const headerString = JSON.stringify(res.headers);
      assert.strictEqual(headerString.includes(configuredToken), false);
    });
  });
});
