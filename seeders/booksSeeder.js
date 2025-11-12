const { connectToDatabase } = require('../config/db');
const booksSeed = require('./data/books');

async function wipeBooks() {
  const db = await connectToDatabase();
  const result = await db.collection('books').deleteMany({});
  console.log(`Usunięto ${result.deletedCount} książek.`);
}

async function seedBooks({ skipWipe = false } = {}) {
  if (!skipWipe) {
    await wipeBooks();
  }

  const db = await connectToDatabase();
  const books = booksSeed();
  await db.collection('books').insertMany(books);
  console.log(`Zasiano ${books.length} książek.`);
  return books.length;
}

module.exports = { seedBooks, wipeBooks };
