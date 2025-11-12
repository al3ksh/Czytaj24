const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../config/db');

const salePriceFor = (book) => Number(book?.discountedPrice ?? book?.price ?? 0);
const toObjectId = (value) => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

class Cart {
  static async getCartByUserId(userId) {
    const db = await connectToDatabase();
    return db.collection('carts').findOne({ userId: new ObjectId(userId) });
  }

  static async createCart(userId) {
    const db = await connectToDatabase();
    const newCart = { userId: new ObjectId(userId), items: [], total: 0 };
    await db.collection('carts').insertOne(newCart);
    return newCart;
  }

  static async addItemToCart(userId, book) {
    const db = await connectToDatabase();
    const cart = await this.getCartByUserId(userId);
    const bookId = toObjectId(book.bookId);

    if (!bookId) {
      throw new Error('Nieprawidłowy identyfikator książki.');
    }

    const bookDetails = await db.collection('books').findOne({ _id: bookId });
    if (!bookDetails) {
      throw new Error('Książka nie została znaleziona.');
    }

    const stock = bookDetails.stock;
    const unitPrice = salePriceFor(bookDetails);

    if (!cart) {
      if (book.quantity > stock) {
        throw new Error(`Nie możesz dodać więcej niż ${stock} sztuk.`);
      }

      const newCart = {
        userId: new ObjectId(userId),
        items: [
          {
            bookId,
            title: bookDetails.title,
            author: bookDetails.author,
            price: unitPrice,
            quantity: book.quantity,
          },
        ],
        total: unitPrice * book.quantity,
      };
      await db.collection('carts').insertOne(newCart);
      return;
    }

    const existingItem = cart.items.find((item) => item.bookId.toString() === bookId.toString());
    const totalQuantity = (existingItem ? existingItem.quantity : 0) + book.quantity;

    if (totalQuantity > stock) {
      throw new Error(`Nie możesz dodać więcej niż ${stock} sztuk.`);
    }

    if (existingItem) {
      existingItem.quantity += book.quantity;
    } else {
      cart.items.push({
        bookId,
        title: bookDetails.title,
        author: bookDetails.author,
        price: unitPrice,
        quantity: book.quantity,
      });
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await db.collection('carts').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { items: cart.items, total: cart.total } }
    );
  }

  static async increaseItemQuantity(userId, bookId) {
    const db = await connectToDatabase();
    const cart = await this.getCartByUserId(userId);
    if (!cart) throw new Error('Koszyk nie został znaleziony.');

    const normalizedId = toObjectId(bookId);
    if (!normalizedId) {
      throw new Error('Nieprawidłowy identyfikator książki.');
    }

    const item = cart.items.find((entry) => entry.bookId.toString() === normalizedId.toString());
    if (!item) throw new Error('Przedmiot nie został znaleziony w koszyku.');

    const book = await db.collection('books').findOne({ _id: normalizedId });
    if (!book) throw new Error('Książka nie została znaleziona.');

    if (item.quantity >= book.stock) {
      throw new Error('Brak większej liczby egzemplarzy w magazynie.');
    }

    item.quantity += 1;
    cart.total = cart.items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0);

    await db.collection('carts').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { items: cart.items, total: cart.total } }
    );
  }

  static async decreaseItemQuantity(userId, bookId) {
    const db = await connectToDatabase();
    const cart = await this.getCartByUserId(userId);
    if (!cart) throw new Error('Koszyk nie został znaleziony.');

    const normalizedId = toObjectId(bookId);
    if (!normalizedId) {
      throw new Error('Nieprawidłowy identyfikator książki.');
    }

    const item = cart.items.find((entry) => entry.bookId.toString() === normalizedId.toString());
    if (!item) throw new Error('Przedmiot nie został znaleziony w koszyku.');

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart.items = cart.items.filter((entry) => entry.bookId.toString() !== normalizedId.toString());
    }

    cart.total = cart.items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0);

    await db.collection('carts').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { items: cart.items, total: cart.total } }
    );
  }

  static async removeItemFromCart(userId, bookId) {
    const db = await connectToDatabase();
    const cart = await this.getCartByUserId(userId);
    if (!cart) throw new Error('Koszyk nie został znaleziony.');

    const normalizedId = toObjectId(bookId);
    if (!normalizedId) {
      throw new Error('Nieprawidłowy identyfikator książki.');
    }

    const updatedItems = cart.items.filter(
      (item) => item.bookId && item.bookId.toString() !== normalizedId.toString()
    );

    const updatedTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await db.collection('carts').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { items: updatedItems, total: updatedTotal } }
    );
  }

  static async clearCart(userId) {
    const db = await connectToDatabase();
    await db.collection('carts').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { items: [], total: 0 } }
    );
  }
}

module.exports = Cart;
