const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { searchLimiter } = require('../middleware/rateLimiters');

router.get('/', bookController.getStorefront);
router.get('/book/:id', bookController.getBookDetails);
router.get('/search', searchLimiter, bookController.searchBooks);
router.get('/api/search', searchLimiter, bookController.searchBooksAPI);

module.exports = router;
