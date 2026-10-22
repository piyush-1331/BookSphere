const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test'; // Ensure rate limits are bypassed for tests

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { generateToken } = require('../src/utils/token');

describe('BookSphere Authentication & Authorization Test Suite', () => {
  const timestamp = Date.now();
  const testUserEmail = `patron_test_${timestamp}@booksphere.org`;
  const testUserPassword = 'SecurePassword123!';
  let testUserToken = null;
  let testUserId = null;

  const testAdminEmail = `admin_test_${timestamp}@booksphere.org`;
  const testAdminPassword = 'AdminSecret987!';
  let testAdminToken = null;

  before(async () => {
    await connectDB();
  });

  after(async () => {
    // Clean up created test accounts
    try {
      await User.deleteMany({
        email: { $in: [testUserEmail, testAdminEmail, `dup_test_${timestamp}@booksphere.org`] },
      });
    } catch (err) {
      console.error('Cleanup error:', err);
    }
    await disconnectDB();
  });

  // 1. REGISTRATION
  describe('1. Registration Flow (POST /api/auth/register)', () => {
    it('should successfully register a new patron and return HttpOnly cookie & user data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Arthur Pendelton',
          email: testUserEmail,
          password: testUserPassword,
          confirmPassword: testUserPassword,
          branch: 'Metropolitan Central (Flagship)',
          phone: '+1-555-0192',
          bio: 'Literary researcher and medieval manuscript collector.',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.user);
      assert.equal(res.body.data.user.email, testUserEmail);
      assert.equal(res.body.data.user.name, 'Arthur Pendelton');
      assert.equal(res.body.data.user.role, 'user');
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.passwordHash, undefined, 'passwordHash must never be exposed');

      // Verify HttpOnly cookie header was set
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies, 'Expected Set-Cookie header to be present');
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      assert.ok(tokenCookie, 'Expected token cookie in Set-Cookie header');
      assert.ok(tokenCookie.includes('HttpOnly'), 'Cookie must be marked HttpOnly');

      testUserToken = res.body.data.token;
      testUserId = res.body.data.user._id;
    });

    it('should strictly disallow users from registering as admin', async () => {
      const maliciousEmail = `malicious_${timestamp}@booksphere.org`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Malicious Attacker',
          email: maliciousEmail,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'admin', // Malicious attempt to self-elevate
        });

      assert.equal(res.status, 201);
      assert.equal(
        res.body.data.user.role,
        'user',
        'User role must be forced to "user" on registration'
      );

      // Clean up
      await User.deleteOne({ email: maliciousEmail });
    });
  });

  // 2. DUPLICATE EMAIL REJECTION
  describe('2. Duplicate Email Prevention', () => {
    it('should reject registration if email is already registered', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Pretender',
          email: testUserEmail, // Already registered in step 1
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'EMAIL_ALREADY_EXISTS');
    });
  });

  // 3. INVALID PASSWORD VALIDATION
  describe('3. Password Validation', () => {
    it('should reject passwords shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password User',
          email: `short_pwd_${timestamp}@booksphere.org`,
          password: '123',
          confirmPassword: '123',
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('should reject registration when password and confirmPassword mismatch', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mismatch User',
          email: `mismatch_${timestamp}@booksphere.org`,
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      const mismatchError = res.body.error.details.find(
        (d) => d.field === 'confirmPassword'
      );
      assert.ok(mismatchError, 'Expected confirmPassword validation error');
    });
  });

  // 4. LOGIN FLOW
  describe('4. Login Flow (POST /api/auth/login)', () => {
    it('should successfully log in with valid credentials and return token & HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.email, testUserEmail);
      assert.equal(res.body.data.user.passwordHash, undefined, 'passwordHash must never be exposed');

      const cookies = res.headers['set-cookie'];
      assert.ok(cookies);
      assert.ok(cookies.some((c) => c.startsWith('token=') && c.includes('HttpOnly')));
    });

    it('should accept email in case-insensitive format during login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail.toUpperCase(),
          password: testUserPassword,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // 5. INVALID CREDENTIALS REJECTION
  describe('5. Invalid Credentials Rejection', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'CompletelyWrongPassword123!',
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: `nobody_here_${timestamp}@booksphere.org`,
          password: 'Password123!',
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
    });
  });

  // 6. AUTHENTICATED REQUESTS (GET /api/auth/me & Profile)
  describe('6. Authenticated Requests (GET /api/auth/me & /api/users/profile)', () => {
    it('should retrieve authenticated user session using Bearer header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUserToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, testUserEmail);
      assert.equal(res.body.data.user.passwordHash, undefined);
    });

    it('should retrieve authenticated user session using HttpOnly Cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `token=${testUserToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, testUserEmail);
    });

    it('should reject unauthenticated request when no token or cookie is supplied', async () => {
      const res = await request(app).get('/api/auth/me');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'AUTHENTICATION_REQUIRED');
    });

    it('should fetch user profile with loan & favorite statistics (GET /api/users/profile)', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testUserToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.user.stats);
      assert.equal(typeof res.body.data.user.stats.activeLoansCount, 'number');
    });

    it('should update user profile (PUT /api/users/profile)', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          bio: 'Updated bio: Senior literary fellow investigating ancient papyri.',
          phone: '+1-555-9988',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(
        res.body.data.user.profile.bio,
        'Updated bio: Senior literary fellow investigating ancient papyri.'
      );
      assert.equal(res.body.data.user.profile.phone, '+1-555-9988');
    });
  });

  // 7. INVALID & MALFORMED JWT
  describe('7. Invalid JWT Rejection', () => {
    it('should reject malformed or tampered JWT tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INVALID_TOKEN');
    });
  });

  // 8. EXPIRED JWT HANDLING
  describe('8. Expired JWT Rejection', () => {
    it('should reject expired JWT tokens with TOKEN_EXPIRED error code', async () => {
      // Create an expired token by specifying negative expiresIn
      const expiredToken = generateToken(
        { id: testUserId, email: testUserEmail, role: 'user' },
        '-1s'
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'TOKEN_EXPIRED');
    });
  });

  // 9. ADMIN AUTHORIZATION
  describe('9. Role-Based Authorization & Admin Privileges', () => {
    before(async () => {
      // Register an admin user directly into DB for authorization testing
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(testAdminPassword, 10);
      const admin = await User.create({
        name: 'Grand Archon Admin',
        email: testAdminEmail,
        passwordHash,
        role: 'admin',
        profile: {
          cardId: `BKSP-ADM-${timestamp}`,
          status: 'active',
          membershipTier: 'Chief Administrator',
        },
      });

      testAdminToken = generateToken({
        id: admin._id,
        email: admin.email,
        role: admin.role,
      });
    });

    it('should reject a standard patron from accessing admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${testUserToken}`); // Standard patron token

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    it('should grant access to an admin user for admin-only endpoint with 200 OK', async () => {
      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${testAdminToken}`); // Admin token

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.role, 'admin');
    });
  });

  // 10. LOGOUT FLOW
  describe('10. Logout Flow (POST /api/auth/logout)', () => {
    it('should clear authentication cookie on logout', async () => {
      const res = await request(app).post('/api/auth/logout');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, 'Signed out successfully.');

      const cookies = res.headers['set-cookie'];
      assert.ok(cookies);
      // Cleared cookie should have empty value or max-age=0 / expires in the past
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      assert.ok(tokenCookie);
      assert.ok(
        tokenCookie.includes('token=;') ||
          tokenCookie.includes('Max-Age=0') ||
          tokenCookie.includes('Expires=Thu, 01 Jan 1970')
      );
    });
  });
});
