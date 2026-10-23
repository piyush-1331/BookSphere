const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test'; // Ensure rate limits are bypassed for tests

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Borrow = require('../src/models/Borrow');
const Favorite = require('../src/models/Favorite');
const { generateToken } = require('../src/utils/token');
const { syncOverdueLoans, isLoanOverdue } = require('../src/services/overdueService');

describe('BookSphere Book Management, Circulation & Favorites Test Suite', () => {
  const timestamp = Date.now();
  let patronUser = null;
  let patronToken = null;

  let secondaryPatron = null;
  let secondaryToken = null;

  let adminUser = null;
  let adminToken = null;

  let testBookId = null;
  let testBookISBN = null;
  let zeroStockBookId = null;
  let adminCreatedBookId = null;
  let testBorrowId = null;

  const generateValidISBN = () => {
    const g1 = Math.floor(1000 + Math.random() * 9000);
    const g2 = Math.floor(1000 + Math.random() * 9000);
    const check = Math.floor(Math.random() * 10);
    return `978-0-${g1}-${g2}-${check}`;
  };

  before(async () => {
    await connectDB();

    // 1. Create a Primary Patron
    patronUser = await User.create({
      name: 'Eleanor Vance',
      email: `eleanor_${timestamp}@booksphere.org`,
      passwordHash: 'dummy_hash_for_token',
      role: 'user',
      profile: { cardId: `BSP-PAT-${timestamp}`, branch: 'Central' },
    });
    patronToken = generateToken({
      id: patronUser._id.toString(),
      userId: patronUser._id.toString(),
      role: patronUser.role,
      email: patronUser.email,
    });

    // 2. Create a Secondary Patron (to test ownership / isolation)
    secondaryPatron = await User.create({
      name: 'Theodora Crain',
      email: `theo_${timestamp}@booksphere.org`,
      passwordHash: 'dummy_hash_for_token',
      role: 'user',
      profile: { cardId: `BSP-SEC-${timestamp}`, branch: 'North' },
    });
    secondaryToken = generateToken({
      id: secondaryPatron._id.toString(),
      userId: secondaryPatron._id.toString(),
      role: secondaryPatron.role,
      email: secondaryPatron.email,
    });

    // 3. Create an Administrator
    adminUser = await User.create({
      name: 'Head Archivist Luke',
      email: `archivist_${timestamp}@booksphere.org`,
      passwordHash: 'dummy_hash_for_token',
      role: 'admin',
      profile: { cardId: `BSP-ADM-${timestamp}`, branch: 'Special Collections' },
    });
    adminToken = generateToken({
      id: adminUser._id.toString(),
      userId: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email,
    });

    // 4. Create a Test Book with available copies
    const book = await Book.create({
      title: `The Chronology of Stars ${timestamp}`,
      author: 'Dr. Alistair Finch',
      ISBN: generateValidISBN(),
      description: 'A comprehensive study of astral movements and stellar observations.',
      genre: 'Astrophysics',
      category: 'Science & Technology',
      publicationYear: 2024,
      publisher: 'Oxford Academic Press',
      language: 'English',
      coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      totalCopies: 5,
      availableCopies: 5,
      status: 'available',
      formats: ['epub', 'hardcover'],
    });
    testBookId = book._id.toString();
    testBookISBN = book.ISBN;

    // 5. Create a Book with Zero Available Copies (out of stock)
    const outOfStockBook = await Book.create({
      title: `Rare Codex of Antiquity ${timestamp}`,
      author: 'Unknown Scribe',
      ISBN: generateValidISBN(),
      description: 'A 14th-century illuminated Latin manuscript on parchment.',
      genre: 'Manuscripts',
      category: 'History',
      publicationYear: 2020,
      publisher: 'Vatican Archives Replica Press',
      language: 'English',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      totalCopies: 2,
      availableCopies: 0,
      status: 'borrowed',
      formats: ['hardcover'],
    });
    zeroStockBookId = outOfStockBook._id.toString();
  });

  after(async () => {
    try {
      // Clean up test data
      if (patronUser) await User.findByIdAndDelete(patronUser._id);
      if (secondaryPatron) await User.findByIdAndDelete(secondaryPatron._id);
      if (adminUser) await User.findByIdAndDelete(adminUser._id);

      if (testBookId) await Book.findByIdAndDelete(testBookId);
      if (zeroStockBookId) await Book.findByIdAndDelete(zeroStockBookId);
      if (adminCreatedBookId) await Book.findByIdAndDelete(adminCreatedBookId);

      await Borrow.deleteMany({
        user: { $in: [patronUser?._id, secondaryPatron?._id, adminUser?._id].filter(Boolean) },
      });
      await Favorite.deleteMany({
        user: { $in: [patronUser?._id, secondaryPatron?._id, adminUser?._id].filter(Boolean) },
      });
    } catch (err) {
      console.error('Book management test cleanup error:', err);
    }
    await disconnectDB();
  });

  // =========================================================================
  // 1. PUBLIC BOOK SEARCH, FILTERING, SORTING & PAGINATION
  // =========================================================================
  describe('1. Public Book Catalog (GET /api/books & GET /api/books/:id)', () => {
    it('should return paginated books list with metadata', async () => {
      const res = await request(app).get('/api/books?limit=5&page=1');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.pagination);
      assert.equal(res.body.pagination.page, 1);
      assert.equal(res.body.pagination.limit, 5);
      assert.ok(typeof res.body.pagination.total === 'number');
    });

    it('should search books by title keyword', async () => {
      const res = await request(app).get(`/api/books?search=Chronology%20of%20Stars%20${timestamp}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
      assert.equal(res.body.data[0]._id, testBookId);
    });

    it('should search books by author name', async () => {
      const res = await request(app).get('/api/books?author=Alistair%20Finch');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
      assert.equal(res.body.data[0].author, 'Dr. Alistair Finch');
    });

    it('should filter books by genre', async () => {
      const res = await request(app).get('/api/books?genre=Astrophysics');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b._id === testBookId));
    });

    it('should filter books by category', async () => {
      const res = await request(app).get('/api/books?category=Science%20%26%20Technology');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b._id === testBookId));
    });

    it('should search books by ISBN query parameter', async () => {
      const res = await request(app).get(`/api/books?isbn=${encodeURIComponent(testBookISBN)}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
      assert.equal(res.body.data[0].ISBN, testBookISBN);
    });

    it('should search books with specific scope=title', async () => {
      const res = await request(app).get(`/api/books?search=Chronology&scope=title`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b._id === testBookId));
    });

    it('should search books with specific scope=author', async () => {
      const res = await request(app).get(`/api/books?search=Alistair&scope=author`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b._id === testBookId));
    });

    it('should search books with specific scope=isbn', async () => {
      const res = await request(app).get(`/api/books?search=${encodeURIComponent(testBookISBN)}&scope=isbn`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b.ISBN === testBookISBN));
    });

    it('should search books with specific scope=genre', async () => {
      const res = await request(app).get(`/api/books?search=Astrophysics&scope=genre`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b._id === testBookId));
    });

    it('should search books with specific scope=category', async () => {
      const res = await request(app).get(`/api/books?search=Science&scope=category`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.some((b) => b._id === testBookId));
    });

    it('should search books matching multi-field criteria simultaneously', async () => {
      const res = await request(app).get(
        `/api/books?title=Chronology&author=Finch&genre=Astrophysics&category=Science%20%26%20Technology&isbn=${encodeURIComponent(testBookISBN)}`
      );
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0]._id, testBookId);
    });

    it('should filter available books only', async () => {
      const res = await request(app).get('/api/books?availability=available');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.every((b) => b.availableCopies > 0));
    });

    it('should filter unavailable books (zero copies)', async () => {
      const res = await request(app).get('/api/books?availability=unavailable');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.every((b) => b.availableCopies === 0));
    });

    it('should sort books by publicationYear descending', async () => {
      const res = await request(app).get('/api/books?sortBy=publicationYear&order=desc&limit=5');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const years = res.body.data.map((b) => b.publicationYear);
      for (let i = 0; i < years.length - 1; i++) {
        assert.ok(years[i] >= years[i + 1]);
      }
    });

    it('should fetch single book by valid ID', async () => {
      const res = await request(app).get(`/api/books/${testBookId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data._id, testBookId);
      assert.equal(res.body.data.title, `The Chronology of Stars ${timestamp}`);
    });

    it('should return 404 for non-existent book ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/books/${fakeId}`);
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'BOOK_NOT_FOUND');
    });

    it('should return 400 for malformed book ObjectId', async () => {
      const res = await request(app).get('/api/books/invalid-id-format');
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // 2. FAVORITES MANAGEMENT
  // =========================================================================
  describe('2. Favorites Shelf (GET, POST, DELETE /api/favorites)', () => {
    it('should reject unauthenticated request to /api/favorites with 401', async () => {
      const res = await request(app).get('/api/favorites');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('should add book to favorites successfully', async () => {
      const res = await request(app)
        .post(`/api/favorites/${testBookId}`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ notes: 'Research reading for chapter 4' });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data);
      assert.equal(res.body.data.book._id, testBookId);
      assert.equal(res.body.data.user.toString(), patronUser._id.toString());
    });

    it('should prevent duplicate favorites with 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/favorites/${testBookId}`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send();

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'ALREADY_FAVORITED');
    });

    it('should return 404 when favoriting a non-existent book', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/favorites/${fakeId}`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send();

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'BOOK_NOT_FOUND');
    });

    it('should list only the authenticated user favorites', async () => {
      // Primary patron should see 1 favorite
      const res = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 1);
      assert.equal(res.body.data[0].book._id, testBookId);

      // Secondary patron should see 0 favorites (user isolation)
      const resSec = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${secondaryToken}`);

      assert.equal(resSec.status, 200);
      assert.equal(resSec.body.count, 0);
      assert.deepEqual(resSec.body.data, []);
    });

    it('should safely remove book from favorites with 200 OK', async () => {
      const res = await request(app)
        .delete(`/api/favorites/${testBookId}`)
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.bookId, testBookId);

      // Verify deletion in shelf
      const checkRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${patronToken}`);
      assert.equal(checkRes.body.count, 0);
    });

    it('should return 404 when trying to delete non-existent favorite', async () => {
      const res = await request(app)
        .delete(`/api/favorites/${testBookId}`)
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FAVORITE_NOT_FOUND');
    });
  });

  // =========================================================================
  // 3. BORROWING LIFECYCLE & STOCK MANAGEMENT
  // =========================================================================
  describe('3. Borrowing Flow (POST /api/borrows, GET /api/borrows/my, GET /api/borrows/:id)', () => {
    it('should reject unauthenticated borrow request with 401', async () => {
      const res = await request(app)
        .post('/api/borrows')
        .send({ bookId: testBookId });

      assert.equal(res.status, 401);
    });

    it('should borrow a book, decrement availableCopies atomically, and set dueDate', async () => {
      const bookBefore = await Book.findById(testBookId);
      const initialCopies = bookBefore.availableCopies;

      const res = await request(app)
        .post('/api/borrows')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          bookId: testBookId,
          durationDays: 14,
          format: 'epub',
          notes: 'Reading for astrophysics PBL seminar',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data._id);
      assert.equal(res.body.data.status, 'borrowed');
      assert.equal(res.body.data.format, 'epub');
      assert.ok(res.body.data.borrowedAt);
      assert.ok(res.body.data.dueDate);

      testBorrowId = res.body.data._id;

      // Verify atomic stock decrement in MongoDB
      const bookAfter = await Book.findById(testBookId);
      assert.equal(bookAfter.availableCopies, initialCopies - 1);
    });

    it('should reject borrowing when availableCopies is 0 with 400', async () => {
      const res = await request(app)
        .post('/api/borrows')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ bookId: zeroStockBookId, durationDays: 7 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'NO_COPIES_AVAILABLE');
    });

    it('should reject borrowing non-existent book with 404', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/borrows')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ bookId: fakeId });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'BOOK_NOT_FOUND');
    });

    it('should list loans for authenticated user at GET /api/borrows/my', async () => {
      const res = await request(app)
        .get('/api/borrows/my')
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);
      assert.equal(res.body.data[0]._id, testBorrowId);
      assert.equal(typeof res.body.data[0].isOverdue, 'boolean');
    });

    it('should fetch borrow details by ID for the borrower (owner)', async () => {
      const res = await request(app)
        .get(`/api/borrows/${testBorrowId}`)
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data._id, testBorrowId);
      assert.equal(res.body.data.book._id, testBookId);
    });

    it('should allow admin to inspect any loan record', async () => {
      const res = await request(app)
        .get(`/api/borrows/${testBorrowId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data._id, testBorrowId);
    });

    it('should reject another patron from viewing a borrow record with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/borrows/${testBorrowId}`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });
  });

  // =========================================================================
  // 4. BOOK RETURN LIFECYCLE
  // =========================================================================
  describe('4. Return Flow (PATCH /api/borrows/:id/return)', () => {
    it('should reject unauthorized user from returning another patron volume with 403', async () => {
      const res = await request(app)
        .patch(`/api/borrows/${testBorrowId}/return`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    it('should allow borrower to return book, set returnedAt, and increment availableCopies', async () => {
      const bookBefore = await Book.findById(testBookId);
      const copiesBefore = bookBefore.availableCopies;

      const res = await request(app)
        .patch(`/api/borrows/${testBorrowId}/return`)
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'returned');
      assert.ok(res.body.data.returnedAt);

      // Verify atomic stock increment in MongoDB
      const bookAfter = await Book.findById(testBookId);
      assert.equal(bookAfter.availableCopies, copiesBefore + 1);
    });

    it('should prevent returning the same book twice with 400', async () => {
      const res = await request(app)
        .patch(`/api/borrows/${testBorrowId}/return`)
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'BOOK_ALREADY_RETURNED');
    });
  });

  // =========================================================================
  // 5. OVERDUE DETECTION & AUDIT SERVICE
  // =========================================================================
  describe('5. Overdue Processing & Calculation', () => {
    it('isLoanOverdue helper should accurately detect overdue active loans', () => {
      const pastDueLoan = {
        status: 'borrowed',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };
      assert.equal(isLoanOverdue(pastDueLoan), true);

      const activeLoan = {
        status: 'borrowed',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      };
      assert.equal(isLoanOverdue(activeLoan), false);

      const returnedPastDue = {
        status: 'returned',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
      assert.equal(isLoanOverdue(returnedPastDue), false);
    });

    it('should transition past-due loans to "overdue" via syncOverdueLoans service', async () => {
      // Create a test loan with a past dueDate
      const overdueLoan = await Borrow.create({
        user: patronUser._id,
        book: testBookId,
        borrowedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'borrowed',
      });

      const auditResult = await syncOverdueLoans();
      assert.ok(auditResult.updatedCount >= 1);

      // Verify the record is now marked 'overdue'
      const updated = await Borrow.findById(overdueLoan._id);
      assert.equal(updated.status, 'overdue');

      // Clean up the artificial overdue loan
      await Borrow.findByIdAndDelete(overdueLoan._id);
    });

    it('should allow admin to trigger overdue audit via POST /api/admin/books/audit-overdue', async () => {
      const res = await request(app)
        .post('/api/admin/books/audit-overdue')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data);
      assert.ok(typeof res.body.data.updatedCount === 'number');
    });
  });

  // =========================================================================
  // 6. ADMIN BOOK CATALOG MANAGEMENT (POST, PATCH, DELETE /api/admin/books)
  // =========================================================================
  describe('6. Admin Book Management (POST, PATCH, DELETE /api/admin/books)', () => {
    it('should reject non-admin patron from creating a book with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/books')
        .set('Authorization', `Bearer ${patronToken}`)
        .send({
          title: 'Unauthorized Volume',
          author: 'Malicious Patron',
          ISBN: generateValidISBN(),
          description: 'A book added without admin privileges.',
          genre: 'Fiction',
          category: 'Literature',
          publicationYear: 2024,
          publisher: 'Unauthorized Press',
          coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
          totalCopies: 5,
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    it('should allow admin to catalog a new book with POST /api/admin/books', async () => {
      const newISBN = generateValidISBN();
      const res = await request(app)
        .post('/api/admin/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Algorithmic Curations in Modern Libraries ${timestamp}`,
          author: 'Prof. Margaret Turing',
          ISBN: newISBN,
          description: 'Exploring machine learning applications in bibliographic systems.',
          genre: 'Computer Science',
          category: 'Science & Technology',
          publicationYear: 2025,
          publisher: 'Cambridge University Press',
          language: 'English',
          coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
          totalCopies: 8,
          availableCopies: 8,
          formats: ['epub', 'pdf'],
          rating: 4.8,
          shelfLocation: 'AI-TECH-A4',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data._id);
      assert.equal(res.body.data.ISBN, newISBN);
      adminCreatedBookId = res.body.data._id;
    });

    it('should reject creating duplicate ISBN with 409 Conflict', async () => {
      const book = await Book.findById(adminCreatedBookId);
      const res = await request(app)
        .post('/api/admin/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Duplicate ISBN Book',
          author: 'Another Author',
          ISBN: book.ISBN, // Duplicate
          description: 'Attempting to catalog with an identical ISBN identifier.',
          genre: 'Tech',
          category: 'Science & Technology',
          publicationYear: 2025,
          publisher: 'Test Press',
          coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
          totalCopies: 3,
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'ISBN_ALREADY_EXISTS');
    });

    it('should reject book creation if availableCopies > totalCopies with 400', async () => {
      const res = await request(app)
        .post('/api/admin/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Impossible Copies Book',
          author: 'Math Error',
          ISBN: generateValidISBN(),
          description: 'Available copies exceed total copies in catalog record.',
          genre: 'Philosophy',
          category: 'Humanities',
          publicationYear: 2024,
          publisher: 'Error Press',
          coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
          totalCopies: 2,
          availableCopies: 10, // Invalid!
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('should allow admin to update an existing book with PATCH /api/admin/books/:id', async () => {
      const res = await request(app)
        .patch(`/api/admin/books/${adminCreatedBookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Algorithmic Curations (Revised 2nd Edition) ${timestamp}`,
          totalCopies: 10,
          availableCopies: 10,
          shelfLocation: 'AI-TECH-A4-RESERVED',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.totalCopies, 10);
      assert.equal(res.body.data.availableCopies, 10);
      assert.equal(res.body.data.shelfLocation, 'AI-TECH-A4-RESERVED');
    });

    it('should reject deleting a book that has active loans in circulation with 400', async () => {
      // Create an active borrow on adminCreatedBookId
      const activeLoan = await Borrow.create({
        user: patronUser._id,
        book: adminCreatedBookId,
        borrowedAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'borrowed',
      });

      const res = await request(app)
        .delete(`/api/admin/books/${adminCreatedBookId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'ACTIVE_LOANS_EXIST');

      // Return the loan to clear active constraint
      activeLoan.status = 'returned';
      activeLoan.returnedAt = new Date();
      await activeLoan.save();
    });

    it('should allow admin to safely delete a book when no active loans exist with 200', async () => {
      const res = await request(app)
        .delete(`/api/admin/books/${adminCreatedBookId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, adminCreatedBookId);

      // Verify book is removed
      const check = await Book.findById(adminCreatedBookId);
      assert.equal(check, null);
      adminCreatedBookId = null; // Prevent double delete in after()
    });
  });

  // =========================================================================
  // 7. ADMIN BORROW APPROVAL, REJECTION & DASHBOARD TELEMETRY
  // =========================================================================
  describe('7. Admin Borrow Approval, Rejection & Dashboard Stats', () => {
    let pendingLoanId;
    let pendingBookId;

    before(async () => {
      // Create a test book for pending borrow
      const pBook = await Book.create({
        title: 'Pending Approval Volume',
        author: 'Staff Registrar',
        ISBN: '978-0-99999-888-1',
        description: 'A volume reserved pending administrative oversight.',
        genre: 'Non-Fiction',
        category: 'Reference',
        publicationYear: 2024,
        publisher: 'Antigravity Academic Press',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        totalCopies: 4,
        availableCopies: 4,
        status: 'available',
      });
      pendingBookId = pBook._id;

      // Create a pending borrow record
      const pLoan = await Borrow.create({
        user: patronUser._id,
        book: pendingBookId,
        format: 'epub',
        borrowedAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'pending',
      });
      pendingLoanId = pLoan._id;
    });

    after(async () => {
      if (pendingBookId) await Book.findByIdAndDelete(pendingBookId);
      if (pendingLoanId) await Borrow.findByIdAndDelete(pendingLoanId);
    });

    it('should reject non-admin from approving a loan with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/borrows/${pendingLoanId}/approve`)
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    it('should allow admin to approve a pending loan, set status="borrowed", and decrement availableCopies', async () => {
      const bookBefore = await Book.findById(pendingBookId);
      const copiesBefore = bookBefore.availableCopies;

      const res = await request(app)
        .patch(`/api/borrows/${pendingLoanId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'borrowed');

      const bookAfter = await Book.findById(pendingBookId);
      assert.equal(bookAfter.availableCopies, copiesBefore - 1);
    });

    it('should reject non-admin from rejecting a loan with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/borrows/${pendingLoanId}/reject`)
        .set('Authorization', `Bearer ${patronToken}`)
        .send({ reason: 'Patron request cancelled.' });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    it('should allow admin to reject a loan with reason and restore copy', async () => {
      const bookBefore = await Book.findById(pendingBookId);
      const copiesBefore = bookBefore.availableCopies;

      const res = await request(app)
        .patch(`/api/borrows/${pendingLoanId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Quota review failure.' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'rejected');

      const bookAfter = await Book.findById(pendingBookId);
      assert.equal(bookAfter.availableCopies, copiesBefore + 1);
    });

    it('should reject non-admin from accessing admin dashboard stats with 403', async () => {
      const res = await request(app)
        .get('/api/admin/books/dashboard/stats')
        .set('Authorization', `Bearer ${patronToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    it('should allow admin to fetch complete dashboard stats at GET /api/admin/books/dashboard/stats', async () => {
      const res = await request(app)
        .get('/api/admin/books/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.data.totalBooks === 'number');
      assert.ok(typeof res.body.data.totalUsers === 'number');
      assert.ok(typeof res.body.data.activeBorrowings === 'number');
      assert.ok(typeof res.body.data.overdueBooks === 'number');
      assert.ok(typeof res.body.data.availableBooks === 'number');
      assert.ok(Array.isArray(res.body.data.recentActivity));
    });
  });
});
