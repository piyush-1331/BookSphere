const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { connectDB, disconnectDB, getDBStatus } = require('../src/config/db');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Borrow = require('../src/models/Borrow');
const Favorite = require('../src/models/Favorite');

const runDatabaseAudit = async () => {
  console.log('=== BookSphere MongoDB Atlas Database Audit ===\n');

  // 1. Verify Connection
  console.log('[Audit 1/5] Verifying MongoDB Atlas Connection...');
  const conn = await connectDB();
  console.log(`PASS: Connected to database "${conn.name}" on host "${conn.host}". ReadyState: ${conn.readyState}`);

  // 2. Verify Collections
  console.log('\n[Audit 2/5] Verifying MongoDB Collections...');
  const collections = await conn.db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  console.log(`Collections found: ${collectionNames.join(', ')}`);

  const requiredCollections = ['users', 'books', 'borrows', 'favorites'];
  const missingCollections = requiredCollections.filter((c) => !collectionNames.includes(c));
  if (missingCollections.length > 0) {
    console.log(`Note: Missing collections: ${missingCollections.join(', ')} (will be created on first document insert)`);
  } else {
    console.log('PASS: All primary domain collections (users, books, borrows, favorites) exist in MongoDB Atlas.');
  }

  // 3. Verify Indexes
  console.log('\n[Audit 3/5] Verifying Database Indexes...');
  // Ensure schema indexes are synced
  await Promise.all([
    User.syncIndexes(),
    Book.syncIndexes(),
    Borrow.syncIndexes(),
    Favorite.syncIndexes(),
  ]);

  const userIndexes = await User.collection.indexes();
  console.log('User Indexes:', userIndexes.map((i) => i.name));
  const bookIndexes = await Book.collection.indexes();
  console.log('Book Indexes:', bookIndexes.map((i) => i.name));
  const borrowIndexes = await Borrow.collection.indexes();
  console.log('Borrow Indexes:', borrowIndexes.map((i) => i.name));
  const favoriteIndexes = await Favorite.collection.indexes();
  console.log('Favorite Indexes:', favoriteIndexes.map((i) => i.name));

  const hasFavoriteUnique = favoriteIndexes.some((i) => i.key && i.key.user === 1 && i.key.book === 1 && i.unique === true);
  console.log(`- Favorite Unique Compound Index (user_1_book_1): ${hasFavoriteUnique ? 'PASS' : 'FAIL'}`);

  const hasBookISBNUnique = bookIndexes.some((i) => i.key && i.key.ISBN === 1 && i.unique === true);
  console.log(`- Book Unique ISBN Index: ${hasBookISBNUnique ? 'PASS' : 'FAIL'}`);

  const hasUserEmailUnique = userIndexes.some((i) => i.key && i.key.email === 1 && i.unique === true);
  console.log(`- User Unique Email Index: ${hasUserEmailUnique ? 'PASS' : 'FAIL'}`);

  // 4. Verify Persistence
  console.log('\n[Audit 4/5] Verifying Document Persistence...');
  const testEmail = `persistence_test_${Date.now()}@booksphere.org`;
  const createdUser = await User.create({
    name: 'Persistence Probe',
    email: testEmail,
    passwordHash: 'dummy_hash_for_test',
    role: 'user',
  });
  const fetchedUser = await User.findById(createdUser._id);
  const persistencePass = fetchedUser && fetchedUser.email === testEmail;
  console.log(`- Inserted and re-queried test document ID ${createdUser._id}: ${persistencePass ? 'PASS' : 'FAIL'}`);
  await User.findByIdAndDelete(createdUser._id);
  console.log('- Cleaned up test document.');

  // 5. Verify Credential Protection
  console.log('\n[Audit 5/5] Verifying Credential Protection...');
  const dbStatus = await getDBStatus();
  console.log('Diagnostic getDBStatus output:', JSON.stringify(dbStatus, null, 2));
  const statusStr = JSON.stringify(dbStatus);
  const uri = process.env.MONGODB_URI;
  let credentialsExposed = false;
  if (uri && uri.includes('@')) {
    const rawCreds = uri.split('://')[1].split('@')[0];
    const [user, pwd] = rawCreds.split(':');
    if (statusStr.includes(pwd) || (pwd && pwd.length > 3 && statusStr.includes(pwd))) {
      credentialsExposed = true;
    }
  }
  console.log(`- Credential Leak Check: ${credentialsExposed ? 'FAIL (Password leaked!)' : 'PASS (No credentials exposed)'}`);

  await disconnectDB();
  console.log('\n=== Database Audit Completed Successfully ===');
};

runDatabaseAudit().catch((err) => {
  console.error('Database audit failed:', err);
  process.exit(1);
});
