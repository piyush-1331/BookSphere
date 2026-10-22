const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const Book = require('./models/Book');
const sampleBooks = require('./seed/sampleBooks');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

/**
 * Initializes database connection and starts Express server
 */
const startServer = async () => {
  try {
    console.log('[Server] Initializing BookSphere backend for production...');

    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Auto-seed catalog if Book collection is empty
    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      console.log(
        '[Server] Catalog is empty. Auto-seeding initial demonstration books...'
      );
      await Book.insertMany(sampleBooks);
      console.log(
        `[Server] Successfully seeded ${sampleBooks.length} demonstration books.`
      );
    } else {
      console.log(`[Server] Catalog contains ${bookCount} books.`);
    }

    // 3. Start listening for incoming HTTP requests bound to 0.0.0.0
    const server = app.listen(PORT, HOST, () => {
      console.log(
        `[Server] BookSphere Express server running on http://${HOST}:${PORT}`
      );
      console.log(
        `[Server] Health Check available at http://${HOST}:${PORT}/api/health`
      );
      console.log(
        `[Server] Book Catalog available at http://${HOST}:${PORT}/api/books`
      );
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(
        `\n[Server] Received ${signal}. Initiating graceful shutdown...`
      );
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        console.log('[Server] Graceful shutdown complete. Exiting process.');
        process.exit(0);
      });

      // Force shutdown after timeout if hanging
      setTimeout(() => {
        console.error(
          '[Server Error] Forced shutdown after timeout. Exiting.'
        );
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle Unhandled Promise Rejections & Uncaught Exceptions
    process.on('unhandledRejection', (reason, promise) => {
      console.error(
        '[Server Error] Unhandled Rejection at:',
        promise,
        'reason:',
        reason
      );
    });

    process.on('uncaughtException', (error) => {
      console.error('[Server Error] Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error(
      '[Server Error] Fatal error during startup. Server stopped:',
      error.message
    );
    process.exit(1);
  }
};

startServer();
