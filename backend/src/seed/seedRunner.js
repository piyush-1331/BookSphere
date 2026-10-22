const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const Book = require('../models/Book');
const User = require('../models/User');
const sampleBooks = require('./sampleBooks');

/**
 * Seeds initial demonstration books and users into MongoDB Atlas.
 * Safe and idempotent: Uses upsert on unique keys.
 */
const seedDatabase = async () => {
  console.log('[Seed] Starting BookSphere database seeding...');

  try {
    await connectDB();

    // 1. Seed Books (Idempotent via ISBN upsert)
    console.log(`[Seed] Seeding ${sampleBooks.length} sample books...`);
    const bookOperations = sampleBooks.map((book) => ({
      updateOne: {
        filter: { ISBN: book.ISBN },
        update: { $set: book },
        upsert: true,
      },
    }));

    const bookResult = await Book.bulkWrite(bookOperations);
    console.log(
      `[Seed] Books processed: ${bookResult.upsertedCount} inserted, ${bookResult.modifiedCount} updated.`
    );

    // 2. Seed Initial Admin User if not present
    const existingAdmin = await User.findOne({ email: 'admin@booksphere.org' });
    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
      await User.create({
        name: 'Dr. Julian Thorne',
        email: 'admin@booksphere.org',
        passwordHash: adminPasswordHash,
        role: 'admin',
        profile: {
          cardId: 'BKSP-0001-ADM',
          branch: 'Central Metropolitan Flagship',
          quotaLimit: 25,
          status: 'active',
          membershipTier: 'Chief Registrar & Faculty Archon',
          bio: 'Chief Registrar overseeing digital circulation and rare manuscript preservation.',
        },
      });
      console.log(
        '[Seed] Default Admin created: admin@booksphere.org (password: Admin@1234)'
      );
    } else {
      console.log('[Seed] Admin user already exists.');
    }

    // 3. Seed Initial Demonstration Patron (Eleanor Vance matching Stitch UI)
    const existingPatron = await User.findOne({ email: 'patron@booksphere.org' });
    if (!existingPatron) {
      const patronPasswordHash = await bcrypt.hash('Patron@1234', 10);
      await User.create({
        name: 'Eleanor Vance',
        email: 'patron@booksphere.org',
        passwordHash: patronPasswordHash,
        role: 'user',
        profile: {
          cardId: 'BKSP-8820-A',
          branch: 'Metropolitan Central (Flagship)',
          quotaLimit: 10,
          status: 'active',
          membershipTier: 'Senior Fellow & Literary Scholar',
          bio: 'Research fellow studying contemporary European brutalist architecture and spatial literature.',
        },
      });
      console.log(
        '[Seed] Default Patron created: patron@booksphere.org (password: Patron@1234)'
      );
    } else {
      console.log('[Seed] Patron user already exists.');
    }

    console.log('[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

// Allow running directly via CLI
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(process.exitCode || 0);
  });
}

module.exports = seedDatabase;
