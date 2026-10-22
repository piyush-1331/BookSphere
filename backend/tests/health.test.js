const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('BookSphere Production Health & Render Deployment Readiness Test Suite', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  describe('1. Health Check Endpoint (GET /api/health)', () => {
    it('should return 200 with Express and MongoDB status', async () => {
      const res = await request(app).get('/api/health');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.status, 'healthy');

      // Verify Express status is explicitly reported
      assert.ok(res.body.express);
      assert.equal(res.body.express.status, 'healthy');
      assert.equal(typeof res.body.express.uptimeSeconds, 'number');

      // Verify MongoDB connection status is explicitly reported
      assert.ok(res.body.mongodb);
      assert.equal(res.body.mongodb.status, 'connected');
      assert.equal(res.body.mongodb.connected, true);
      assert.equal(res.body.mongodb.readyState, 1);
      assert.equal(typeof res.body.mongodb.databaseName, 'string');
    });

    it('should also respond successfully on alias route GET /health', async () => {
      const res = await request(app).get('/health');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.express.status, 'healthy');
      assert.equal(res.body.mongodb.status, 'connected');
    });

    it('should never expose sensitive database credentials or secret tokens in health responses', async () => {
      const res = await request(app).get('/api/health');
      const responseText = JSON.stringify(res.body);

      // Verify no passwords, tokens, or raw connection credentials are leaked
      assert.equal(responseText.includes('AI_SERVICE_TOKEN'), false);
      assert.equal(responseText.includes('JWT_SECRET'), false);
      assert.equal(responseText.includes('password'), false);
      assert.equal(responseText.includes('mongodb+srv://'), false);
    });
  });

  describe('2. CORS & Security Verification', () => {
    it('should accept allowed origins and set appropriate CORS headers', async () => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const res = await request(app)
        .get('/api/health')
        .set('Origin', frontendUrl);

      assert.equal(res.status, 200);
      assert.equal(res.headers['access-control-allow-origin'], frontendUrl);
      assert.equal(res.headers['access-control-allow-credentials'], 'true');
    });
  });
});
