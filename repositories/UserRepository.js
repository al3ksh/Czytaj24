const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../config/db');

class UserRepository {
  static async collection() {
    const db = await connectToDatabase();
    return db.collection('users');
  }

  static async findByEmail(email) {
    if (!email) return null;
    const collection = await this.collection();
    return collection.findOne({ email: email.toLowerCase() });
  }

  static async createUser({ name, email, password, role = 'customer' }) {
    const collection = await this.collection();
    const userCount = await collection.countDocuments();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userCount === 0 ? 'admin' : (role || 'customer'),
      createdAt: new Date(),
    };
    const result = await collection.insertOne(user);
    return { _id: result.insertedId, ...user };
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findById(id) {
    if (!id) {
      return null;
    }

    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async updatePassword(id, newPassword) {
    if (!id || !newPassword) {
      return false;
    }

    const collection = await this.collection();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }
}

module.exports = UserRepository;
