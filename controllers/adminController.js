const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../config/db');
const BookRepository = require('../repositories/BookRepository');

exports.getDashboard = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const booksCollection = db.collection('books');
    const ordersCollection = db.collection('orders');

    const totalBooks = await booksCollection.countDocuments();
    const totalOrders = await ordersCollection.countDocuments();
    const lowStockBooks = await booksCollection.countDocuments({ stock: { $lt: 5 } });
    
    const recentOrders = await ordersCollection
      .find()
      .sort({ date: -1 })
      .limit(5)
      .toArray();

    const stats = {
      totalBooks,
      totalOrders,
      lowStockBooks,
      recentOrders
    };

    res.render('admin/dashboard', {
      userName: req.session.userName,
      stats
    });
  } catch (error) {
    console.error('Błąd dashboard admina:', error);
    res.status(500).render('error', {
      message: 'Błąd ładowania dashboardu',
      statusCode: 500
    });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const books = await db.collection('books')
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.render('admin/books', {
      userName: req.session.userName,
      books
    });
  } catch (error) {
    console.error('Błąd pobierania książek:', error);
    res.status(500).render('error', {
      message: 'Błąd ładowania książek',
      statusCode: 500
    });
  }
};

exports.getBookForm = async (req, res) => {
  try {
    let book = null;
    
    if (req.params.id) {
      const db = await connectToDatabase();
      book = await db.collection('books').findOne({ _id: new ObjectId(req.params.id) });
      
      if (!book) {
        return res.status(404).render('error', {
          message: 'Książka nie znaleziona',
          statusCode: 404
        });
      }
    }

    res.render('admin/bookForm', {
      userName: req.session.userName,
      book,
      errors: {},
      values: book || {}
    });
  } catch (error) {
    console.error('Błąd formularza książki:', error);
    res.status(500).render('error', {
      message: 'Błąd ładowania formularza',
      statusCode: 500
    });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, author, price, stock, category, language, description, discountPercent } = req.body;
    const errors = {};
    const values = req.body;

    if (!title || title.trim() === '') errors.title = 'Tytuł jest wymagany';
    if (!author || author.trim() === '') errors.author = 'Autor jest wymagany';
    if (!price || isNaN(price) || Number(price) <= 0) errors.price = 'Cena musi być liczbą większą od 0';
    if (stock === undefined || isNaN(stock) || Number(stock) < 0) errors.stock = 'Stan musi być liczbą nieujemną';

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('admin/bookForm', {
        userName: req.session.userName,
        book: null,
        errors,
        values
      });
    }

    const db = await connectToDatabase();
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      stock: Number(stock),
      category: category || 'Inne',
      language: language || 'polski',
      description: description || '',
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      discountedPrice: discountPercent ? Number(price) * (1 - Number(discountPercent) / 100) : null,
      aggregatedRating: 4.5,
      tags: [],
      createdAt: new Date()
    };

    await db.collection('books').insertOne(bookData);
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Błąd tworzenia książki:', error);
    res.status(500).render('admin/bookForm', {
      userName: req.session.userName,
      book: null,
      errors: { general: 'Wystąpił błąd podczas tworzenia książki' },
      values: req.body
    });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, price, stock, category, language, description, discountPercent } = req.body;
    const errors = {};
    const values = req.body;

    if (!title || title.trim() === '') errors.title = 'Tytuł jest wymagany';
    if (!author || author.trim() === '') errors.author = 'Autor jest wymagany';
    if (!price || isNaN(price) || Number(price) <= 0) errors.price = 'Cena musi być liczbą większą od 0';
    if (stock === undefined || isNaN(stock) || Number(stock) < 0) errors.stock = 'Stan musi być liczbą nieujemną';

    if (Object.keys(errors).length > 0) {
      const db = await connectToDatabase();
      const book = await db.collection('books').findOne({ _id: new ObjectId(id) });
      
      return res.status(400).render('admin/bookForm', {
        userName: req.session.userName,
        book,
        errors,
        values
      });
    }

    const db = await connectToDatabase();
    const updateData = {
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      stock: Number(stock),
      category: category || 'Inne',
      language: language || 'polski',
      description: description || '',
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      discountedPrice: discountPercent ? Number(price) * (1 - Number(discountPercent) / 100) : null,
      updatedAt: new Date()
    };

    await db.collection('books').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.redirect('/admin/books');
  } catch (error) {
    console.error('Błąd aktualizacji książki:', error);
    res.status(500).render('error', {
      message: 'Błąd aktualizacji książki',
      statusCode: 500
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectToDatabase();
    
    await db.collection('books').deleteOne({ _id: new ObjectId(id) });
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Błąd usuwania książki:', error);
    res.status(500).render('error', {
      message: 'Błąd usuwania książki',
      statusCode: 500
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const orders = await db.collection('orders')
      .find()
      .sort({ date: -1 })
      .toArray();

    res.render('admin/orders', {
      userName: req.session.userName,
      orders
    });
  } catch (error) {
    console.error('Błąd pobierania zamówień:', error);
    res.status(500).render('error', {
      message: 'Błąd ładowania zamówień',
      statusCode: 500
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const db = await connectToDatabase();
    await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Błąd aktualizacji statusu:', error);
    res.status(500).render('error', {
      message: 'Błąd aktualizacji statusu',
      statusCode: 500
    });
  }
};
