const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const Cart = require('../models/cart');
const { connectToDatabase } = require('../config/db');

const ensureCartOwner = (req) => {
  if (req.session?.userId) {
    return { type: 'user', id: req.session.userId };
  }

  if (!req.session.guestId) {
    req.session.guestId = crypto.randomUUID();
  }

  return { type: 'guest', id: req.session.guestId };
};

exports.getCart = async (req, res) => {
  try {
    const owner = ensureCartOwner(req);
    const cart = await Cart.getCartByOwner(owner);

    res.render('cart', {
      items: cart?.items || [],
      total: cart?.total || 0,
      isGuest: owner.type === 'guest',
    });
  } catch (error) {
    console.error('Błąd pobierania koszyka:', error);
    res.status(500).render('error', { message: 'Wystąpił problem podczas pobierania koszyka.' });
  }
};

exports.addToCart = async (req, res) => {
  const { bookId, quantity } = req.body;
  const owner = ensureCartOwner(req);

  if (!bookId || !quantity) {
    return res.status(400).json({ message: 'Brakuje identyfikatora książki lub ilości.' });
  }

  try {
    await Cart.addItemToCart(owner, { bookId, quantity: parseInt(quantity, 10) });
    res.status(200).json({ message: 'Książka została dodana do koszyka.' });
  } catch (error) {
    console.error('Błąd dodawania do koszyka:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.increaseItemQuantity = async (req, res) => {
  const { bookId } = req.body;
  try {
    const owner = ensureCartOwner(req);
    await Cart.increaseItemQuantity(owner, bookId);
    res.status(200).json({ message: 'Zwiększono ilość.' });
  } catch (error) {
    console.error('Błąd zwiększania ilości:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.decreaseItemQuantity = async (req, res) => {
  const { bookId } = req.body;
  try {
    const owner = ensureCartOwner(req);
    await Cart.decreaseItemQuantity(owner, bookId);
    res.status(200).json({ message: 'Zmniejszono ilość.' });
  } catch (error) {
    console.error('Błąd zmniejszania ilości:', error.message);
    res.status(500).json({ message: 'Nie udało się zmniejszyć ilości książki.' });
  }
};

exports.removeItemFromCart = async (req, res) => {
  const { bookId } = req.body;
  try {
    const owner = ensureCartOwner(req);
    await Cart.removeItemFromCart(owner, bookId);
    res.status(200).json({ message: 'Usunięto książkę z koszyka.' });
  } catch (error) {
    console.error('Błąd usuwania z koszyka:', error.message);
    res.status(500).json({ message: 'Nie udało się usunąć pozycji.' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const owner = ensureCartOwner(req);
    await Cart.clearCart(owner);
    res.status(200).json({ message: 'Koszyk został wyczyszczony.' });
  } catch (error) {
    console.error('Błąd czyszczenia koszyka:', error.message);
    res.status(500).json({ message: 'Nie udało się wyczyścić koszyka.' });
  }
};
