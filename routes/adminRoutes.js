const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');


router.get('/', isAdmin, adminController.getDashboard);


router.get('/books', isAdmin, adminController.getBooks);
router.get('/books/new', isAdmin, adminController.getBookForm);
router.post('/books', isAdmin, adminController.createBook);
router.get('/books/:id/edit', isAdmin, adminController.getBookForm);
router.post('/books/:id', isAdmin, adminController.updateBook);
router.post('/books/:id/delete', isAdmin, adminController.deleteBook);


router.get('/orders', isAdmin, adminController.getOrders);
router.post('/orders/:id/status', isAdmin, adminController.updateOrderStatus);

module.exports = router;
