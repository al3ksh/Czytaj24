const { MongoClient } = require('mongodb');
const config = require('./env');

let client;
let database;

async function connectToDatabase() {
  if (database) {
    return database;
  }

  client = new MongoClient(config.mongo.uri);
  await client.connect();
  database = client.db(config.mongo.dbName);
  await ensureIndexes(database);

  return database;
}

async function ensureIndexes(db) {
  const books = db.collection('books');
  const orders = db.collection('orders');
  const carts = db.collection('carts');
  const reviews = db.collection('reviews');

  
  const [bookIndexes, orderIndexes] = await Promise.all([
    books.indexes(),
    orders.indexes(),
  ]);

  const [cartIndexes, reviewIndexes] = await Promise.all([
    carts.indexes(),
    reviews.indexes(),
  ]);

  const ops = [];

  
  if (!bookIndexes.some((i) => i.name === 'books_text_search')) {
    ops.push(
      books.createIndex(
        { title: 'text', author: 'text', description: 'text' },
        {
          name: 'books_text_search',
          weights: { title: 5, author: 3, description: 1 },
          
          language_override: 'none',
          
          default_language: 'none',
        }
      )
    );
  }

  if (!bookIndexes.some((i) => i.name === 'books_category_idx')) {
    ops.push(books.createIndex({ category: 1 }, { name: 'books_category_idx' }));
  }

  if (!bookIndexes.some((i) => i.name === 'books_tags_idx')) {
    ops.push(books.createIndex({ tags: 1 }, { name: 'books_tags_idx' }));
  }

  if (!orderIndexes.some((i) => i.name === 'orders_user_date_idx')) {
    ops.push(orders.createIndex({ userId: 1, date: -1 }, { name: 'orders_user_date_idx' }));
  }

  if (!cartIndexes.some((i) => i.name === 'carts_expiresAt_ttl')) {
    ops.push(carts.createIndex({ expiresAt: 1 }, { name: 'carts_expiresAt_ttl', expireAfterSeconds: 0 }));
  }

  if (!cartIndexes.some((i) => i.name === 'carts_user_idx')) {
    ops.push(carts.createIndex({ userId: 1 }, { name: 'carts_user_idx' }));
  }

  if (!cartIndexes.some((i) => i.name === 'carts_guest_idx')) {
    ops.push(carts.createIndex({ guestId: 1 }, { name: 'carts_guest_idx' }));
  }

  if (!reviewIndexes.some((i) => i.name === 'reviews_book_date_idx')) {
    ops.push(reviews.createIndex({ bookId: 1, createdAt: -1 }, { name: 'reviews_book_date_idx' }));
  }

  if (ops.length === 0) return;

  const results = await Promise.allSettled(ops);
  results
    .filter((result) => result.status === 'rejected')
    .forEach((result) => {
      console.warn('Index creation warning:', result.reason);
    });
}

function getDb() {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return database;
}

module.exports = { connectToDatabase, getDb };
