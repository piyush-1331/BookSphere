const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/healthRoutes');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const adminBookRoutes = require('./routes/adminBookRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const mongoose = require('mongoose');

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
const configuredFrontend = process.env.FRONTEND_URL;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

if (configuredFrontend) {
  // Support comma-separated URLs if multiple origins or preview URLs are specified
  configuredFrontend
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .forEach((origin) => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    });
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Root welcome probe
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BookSphere API. Use /api/health or /api/books.',
    docs: '/api/health',
  });
});

// Mount health routes (both /api/health and /health)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Database readiness guard: ensure database connection is established before accepting normal API requests
app.use((req, res, next) => {
  // Allow health checks, root probe, and non-db routes to proceed without blocking
  if (
    req.path === '/' ||
    req.path === '/health' ||
    req.path.startsWith('/health/') ||
    req.path === '/api/health' ||
    req.path.startsWith('/api/health/')
  ) {
    return next();
  }

  // readyState 1 = connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is not ready. Server is waiting for database connection.',
      code: 'DATABASE_NOT_READY',
    });
  }

  next();
});

// Mount rate limiter on /api routes
app.use('/api', apiLimiter);

// Mount modular API routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/admin/books', adminBookRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
