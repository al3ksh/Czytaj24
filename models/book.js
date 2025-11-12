const { connectToDatabase } = require('../config/db');
const { ObjectId } = require('mongodb');


class Book {
  static async findAll(filters) {
    const db = await connectToDatabase();
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.language) query.language = filters.language;
    if (filters.search) query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { author: { $regex: filters.search, $options: 'i' } },
    ];
    return db.collection('books').find(query).toArray();
  }

  static async findById(id) {
    const db = await connectToDatabase();
    return db.collection('books').findOne({ _id: new ObjectId(id) });
  }

  static async updateStock(bookId, quantity) {
    const db = await connectToDatabase();
    return db.collection('books').updateOne(
      { _id: bookId },
      { $inc: { stock: -quantity } }
    );
  }
}

module.exports = Book;
