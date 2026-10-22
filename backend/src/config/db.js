const mongoose = require('mongoose');

/**
 * Masks credentials in a MongoDB connection URI for safe logging.
 * Replaces username:password with ***:***.
 * @param {string} uri
 * @returns {string} Sanitized URI
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/\/\/[^@]+@/, '//***:***@');
  } catch {
    return '***';
  }
};

/**
 * Reusable MongoDB Connection Module
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const dbName = process.env.MONGODB_DB_NAME || 'booksphere';

  const options = {
    dbName,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    // Avoid re-connecting if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('[Database] Already connected to MongoDB Atlas.');
      return mongoose.connection;
    }

    const conn = await mongoose.connect(mongoUri, options);
    console.log(
      `[Database] Successfully connected to MongoDB Atlas. Database: "${conn.connection.name}", Host: ${conn.connection.host}`
    );
    return conn.connection;
  } catch (error) {
    console.error(
      `[Database Error] Failed to connect to MongoDB Atlas (${sanitizeMongoUri(mongoUri)}):`,
      error.message
    );
    throw error;
  }
};

/**
 * Gracefully closes the MongoDB connection.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (error) {
    console.error('[Database Error] Error during disconnection:', error.message);
  }
};

/**
 * Returns diagnostic connection status without exposing sensitive credentials.
 * Used for /api/health endpoint.
 */
const getDBStatus = async () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  const status = stateMap[readyState] || 'unknown';

  let pingMs = null;
  if (readyState === 1 && mongoose.connection.db) {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - startTime;
    } catch {
      pingMs = null;
    }
  }

  return {
    status,
    readyState,
    databaseName: mongoose.connection.name || 'booksphere',
    host: mongoose.connection.host || 'unknown',
    pingMs,
  };
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] Connection error occurred:', err.message);
});

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};
