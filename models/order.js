const { connectToDatabase } = require('../config/db');

class Order {
  static async createOrder(userId, items, total, name, address, payment) {
    const db = await connectToDatabase();
    return db.collection('orders').insertOne({
      userId,
      items,
      total,
      name,
      address,
      payment,
      status: 'pending',
      date: new Date(),
    });
  }

  static async findOrdersByUserId(userId) {
    const db = await connectToDatabase();
    return db.collection('orders').find({ userId }).sort({ date: -1 }).toArray();
  }

  static async findById(orderId) {
    const db = await connectToDatabase();
    return db.collection('orders').findOne({ _id: orderId });
  }

  static async cancelOrder(orderId) {
    const db = await connectToDatabase();
    return db.collection('orders').updateOne({ _id: orderId }, { $set: { status: 'cancelled' } });
  }

  static async deleteOrder(orderId) {
    const db = await connectToDatabase();
    return db.collection('orders').deleteOne({ _id: orderId });
  }
}

module.exports = Order;
