const { connectToDatabase } = require('../config/db');
const { ObjectId } = require('mongodb');

exports.getOrders = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = new ObjectId(req.session.userId);

    const orders = await db
      .collection('orders')
      .find({ userId })
      .sort({ date: -1 })
      .toArray();

    res.render('orders', { orders });
  } catch (error) {
    console.error('Błąd podczas pobierania zamówień:', error);
    res.status(500).render('error', { message: 'Nie udało się pobrać zamówień.' });
  }
};

exports.showOrder = async (req, res) => {
  try {
    const db = await connectToDatabase();

    if (!req.session.userId) {
      return res.status(400).render('error', { message: 'Musisz być zalogowany, aby przejść do płatności.' });
    }

    const cart = await db.collection('carts').findOne({ userId: new ObjectId(req.session.userId) });

    if (!cart || cart.items.length === 0) {
      return res.render('order', { items: [], total: 0 });
    }

    res.render('order', {
      items: cart.items,
      total: cart.total,
    });
  } catch (error) {
    console.error('Błąd podczas wyświetlania zamówienia:', error);
    res.status(500).render('error', { message: 'Wystąpił problem podczas wyświetlania zamówienia.' });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      street, 
      city, 
      postalCode, 
      delivery, 
      paymentMethod,
      cardNumber,
      cardExpiry,
      cardCvv,
      blikCode
    } = req.body;

    
    if (!name || !phone || !street || !city || !postalCode || !delivery || !paymentMethod) {
      return res.status(400).render('error', { 
        message: 'Wszystkie pola są wymagane. Uzupełnij formularz.' 
      });
    }

    
    const postalRegex = /^\d{2}-\d{3}$/;
    if (!postalRegex.test(postalCode)) {
      return res.status(400).render('error', { 
        message: 'Nieprawidłowy kod pocztowy. Użyj formatu XX-XXX.' 
      });
    }

    
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        return res.status(400).render('error', { 
          message: 'Uzupełnij wszystkie dane karty płatniczej.' 
        });
      }
      
      const cardDigits = cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cardDigits)) {
        return res.status(400).render('error', { 
          message: 'Nieprawidłowy numer karty.' 
        });
      }
      
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        return res.status(400).render('error', { 
          message: 'Nieprawidłowa data ważności karty. Użyj formatu MM/RR.' 
        });
      }
      
      if (!/^\d{3,4}$/.test(cardCvv)) {
        return res.status(400).render('error', { 
          message: 'Nieprawidłowy kod CVV.' 
        });
      }
    } else if (paymentMethod === 'blik') {
      if (!blikCode) {
        return res.status(400).render('error', { 
          message: 'Wpisz 6-cyfrowy kod BLIK.' 
        });
      }
      if (!/^\d{6}$/.test(blikCode)) {
        return res.status(400).render('error', { 
          message: 'Kod BLIK musi składać się z 6 cyfr.' 
        });
      }
    }

    const db = await connectToDatabase();
    const userId = new ObjectId(req.session.userId);

    const cart = await db.collection('carts').findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart?error=Koszyk jest pusty.');
    }

    
    const deliveryCosts = {
      'courier': 15,
      'inpost': 12,
      'post': 10,
      'pickup': 0
    };
    const deliveryCost = deliveryCosts[delivery] || 0;
    const totalWithDelivery = cart.total + deliveryCost;

    
    const order = {
      userId,
      items: cart.items,
      subtotal: cart.total,
      deliveryCost,
      total: totalWithDelivery,
      customerInfo: {
        name,
        phone,
        address: {
          street,
          city,
          postalCode
        }
      },
      delivery,
      paymentMethod,
      
      paymentDetails: paymentMethod === 'card' ? {
        lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
        expiryDate: cardExpiry
      } : paymentMethod === 'blik' ? {
        blikUsed: true
      } : null,
      date: new Date(),
      cancelDeadline: new Date(Date.now() + 30 * 1000),
      status: 'pending',
    };

    await db.collection('orders').insertOne(order);

    
    for (const item of cart.items) {
      await db.collection('books').updateOne(
        { _id: new ObjectId(item.bookId) },
        { $inc: { stock: -item.quantity } }
      );
    }

    
    await db.collection('carts').deleteOne({ userId });

    res.redirect('/order/success');
  } catch (error) {
    console.error('Błąd w confirmOrder:', error);
    res.status(500).render('error', { message: 'Wystąpił błąd podczas składania zamówienia.' });
  }
};

exports.orderSuccess = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = new ObjectId(req.session.userId);

    const previousOrders = await db
      .collection('orders')
      .find({ userId })
      .sort({ date: -1 })
      .toArray();

    res.render('orderSuccess', { previousOrders });
  } catch (error) {
    console.error('Błąd podczas wyświetlania sukcesu zamówienia:', error);
    res.redirect('/?error=Nie udało się wyświetlić poprzednich zamówień.');
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const orderId = new ObjectId(req.params.id);

    const order = await db.collection('orders').findOne({ _id: orderId });

    if (!order || order.status !== 'pending') {
      return res.redirect('/orders?error=Nie można anulować tego zamówienia.');
    }

    for (const item of order.items) {
      await db.collection('books').updateOne(
        { _id: new ObjectId(item.bookId) },
        { $inc: { stock: item.quantity } }
      );
    }

    await db.collection('orders').updateOne({ _id: orderId }, { $set: { status: 'cancelled' } });

    res.redirect('/orders');
  } catch (error) {
    console.error('Błąd podczas anulowania zamówienia:', error);
    res.status(500).render('error', { message: 'Nie udało się anulować zamówienia.' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const orderId = new ObjectId(req.params.id);
    await db.collection('orders').deleteOne({ _id: orderId });
    res.redirect('/orders');
  } catch (error) {
    console.error('Błąd podczas usuwania zamówienia:', error);
    res.status(500).render('error', { message: 'Nie udało się usunąć zamówienia.' });
  }
};
