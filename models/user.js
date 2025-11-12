const { connectToDatabase } = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  static async findByEmail(email) {
    const db = await connectToDatabase();
    return db.collection('users').findOne({ email });
  }

  static async createUser(name, email, password) {
    const db = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);
    return db.collection('users').insertOne({ name, email, password: hashedPassword, createdAt: new Date() });
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
