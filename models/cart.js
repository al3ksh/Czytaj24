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

const guestExpiryDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const buildOwnerQuery = (owner) => {
  if (!owner) return {};
  if (owner.type === 'guest') {
    return { guestId: owner.id };
  }
  const userId = toObjectId(owner.id);
  return userId ? { userId } : {};
};

class Cart {
  static async getCartByOwner(owner) {
    const db = await connectToDatabase();
    const query = buildOwnerQuery(owner);
    if (!Object.keys(query).length) return null;
    return db.collection('carts').findOne(query);
  }

  static async createCart(owner) {
    const db = await connectToDatabase();
    const cart = owner.type === 'guest'
      ? { guestId: owner.id, items: [], total: 0, expiresAt: guestExpiryDate() }
      : { userId: new ObjectId(owner.id), items: [], total: 0 };
    await db.collection('carts').insertOne(cart);
    return cart;
  }

  static async addItemToCart(owner, book) {
    const db = await connectToDatabase();
    const cart = await this.getCartByOwner(owner);
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

      const newCart = owner.type === 'guest'
        ? {
          guestId: owner.id,
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
          expiresAt: guestExpiryDate(),
        }
        : {
        userId: new ObjectId(owner.id),
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

    const updatePayload = {
      items: cart.items,
      total: cart.total,
    };

    if (owner.type === 'guest') {
      updatePayload.expiresAt = guestExpiryDate();
    }

    await db.collection('carts').updateOne(
      buildOwnerQuery(owner),
      { $set: updatePayload }
    );
  }

  static async increaseItemQuantity(owner, bookId) {
    const db = await connectToDatabase();
    const cart = await this.getCartByOwner(owner);
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

    const updatePayload = {
      items: cart.items,
      total: cart.total,
    };
    if (owner.type === 'guest') {
      updatePayload.expiresAt = guestExpiryDate();
    }

    await db.collection('carts').updateOne(
      buildOwnerQuery(owner),
      { $set: updatePayload }
    );
  }

  static async decreaseItemQuantity(owner, bookId) {
    const db = await connectToDatabase();
    const cart = await this.getCartByOwner(owner);
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

    const updatePayload = {
      items: cart.items,
      total: cart.total,
    };
    if (owner.type === 'guest') {
      updatePayload.expiresAt = guestExpiryDate();
    }

    await db.collection('carts').updateOne(
      buildOwnerQuery(owner),
      { $set: updatePayload }
    );
  }

  static async removeItemFromCart(owner, bookId) {
    const db = await connectToDatabase();
    const cart = await this.getCartByOwner(owner);
    if (!cart) throw new Error('Koszyk nie został znaleziony.');

    const normalizedId = toObjectId(bookId);
    if (!normalizedId) {
      throw new Error('Nieprawidłowy identyfikator książki.');
    }

    const updatedItems = cart.items.filter(
      (item) => item.bookId && item.bookId.toString() !== normalizedId.toString()
    );

    const updatedTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const updatePayload = {
      items: updatedItems,
      total: updatedTotal,
    };
    if (owner.type === 'guest') {
      updatePayload.expiresAt = guestExpiryDate();
    }

    await db.collection('carts').updateOne(
      buildOwnerQuery(owner),
      { $set: updatePayload }
    );
  }

  static async clearCart(owner) {
    const db = await connectToDatabase();
    const updatePayload = { items: [], total: 0 };
    if (owner.type === 'guest') {
      updatePayload.expiresAt = guestExpiryDate();
    }
    await db.collection('carts').updateOne(
      buildOwnerQuery(owner),
      { $set: updatePayload }
    );
  }

  static async mergeGuestCart(guestId, userId) {
    if (!guestId || !userId) return;

    const db = await connectToDatabase();
    const guestCart = await db.collection('carts').findOne({ guestId });
    if (!guestCart || !guestCart.items?.length) return;

    const userObjectId = toObjectId(userId);
    if (!userObjectId) return;

    const userCart = await db.collection('carts').findOne({ userId: userObjectId });
    const mergedItems = userCart?.items ? [...userCart.items] : [];

    for (const guestItem of guestCart.items) {
      const bookId = toObjectId(guestItem.bookId);
      if (!bookId) continue;

      const book = await db.collection('books').findOne({ _id: bookId });
      if (!book) continue;

      const unitPrice = salePriceFor(book);
      const existingItem = mergedItems.find((item) => item.bookId.toString() === bookId.toString());
      const incomingQty = Number(guestItem.quantity || 0);
      const currentQty = Number(existingItem?.quantity || 0);
      const nextQty = Math.min(book.stock, currentQty + incomingQty);

      if (nextQty <= 0) continue;

      if (existingItem) {
        existingItem.quantity = nextQty;
        existingItem.price = unitPrice;
        existingItem.title = book.title;
        existingItem.author = book.author;
      } else {
        mergedItems.push({
          bookId,
          title: book.title,
          author: book.author,
          price: unitPrice,
          quantity: Math.min(book.stock, incomingQty),
        });
      }
    }

    const mergedTotal = mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (!userCart) {
      await db.collection('carts').insertOne({ userId: userObjectId, items: mergedItems, total: mergedTotal });
    } else {
      await db.collection('carts').updateOne(
        { userId: userObjectId },
        { $set: { items: mergedItems, total: mergedTotal } }
      );
    }

    await db.collection('carts').deleteOne({ guestId });
  }
}

module.exports = Cart;
