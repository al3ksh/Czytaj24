const { ObjectId } = require('mongodb');
const Cart = require('../models/cart');
const { connectToDatabase } = require('../config/db');

exports.getCart = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = new ObjectId(req.session.userId);
    const cart = await db.collection('carts').findOne({ userId });

    res.render('cart', {
      items: cart?.items || [],
      total: cart?.total || 0,
    });
  } catch (error) {
    console.error('Błąd pobierania koszyka:', error);
    res.status(500).render('error', { message: 'Wystąpił problem podczas pobierania koszyka.' });
  }
};

exports.addToCart = async (req, res) => {
  const { bookId, quantity } = req.body;
  const userId = req.session.userId;

  if (!bookId || !quantity) {
    return res.status(400).json({ message: 'Brakuje identyfikatora książki lub ilości.' });
  }

  try {
    await Cart.addItemToCart(userId, { bookId, quantity: parseInt(quantity, 10) });
    res.status(200).json({ message: 'Książka została dodana do koszyka.' });
  } catch (error) {
    console.error('Błąd dodawania do koszyka:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.increaseItemQuantity = async (req, res) => {
  const { bookId } = req.body;
  try {
    await Cart.increaseItemQuantity(req.session.userId, bookId);
    res.status(200).json({ message: 'Zwiększono ilość.' });
  } catch (error) {
    console.error('Błąd zwiększania ilości:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.decreaseItemQuantity = async (req, res) => {
  const { bookId } = req.body;
  try {
    await Cart.decreaseItemQuantity(req.session.userId, bookId);
    res.status(200).json({ message: 'Zmniejszono ilość.' });
  } catch (error) {
    console.error('Błąd zmniejszania ilości:', error.message);
    res.status(500).json({ message: 'Nie udało się zmniejszyć ilości książki.' });
  }
};

exports.removeItemFromCart = async (req, res) => {
  const { bookId } = req.body;
  try {
    await Cart.removeItemFromCart(req.session.userId, bookId);
    res.status(200).json({ message: 'Usunięto książkę z koszyka.' });
  } catch (error) {
    console.error('Błąd usuwania z koszyka:', error.message);
    res.status(500).json({ message: 'Nie udało się usunąć pozycji.' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.clearCart(req.session.userId);
    res.status(200).json({ message: 'Koszyk został wyczyszczony.' });
  } catch (error) {
    console.error('Błąd czyszczenia koszyka:', error.message);
    res.status(500).json({ message: 'Nie udało się wyczyścić koszyka.' });
  }
};
