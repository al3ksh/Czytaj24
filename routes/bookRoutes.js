const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { searchLimiter } = require('../middleware/rateLimiters');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', bookController.getStorefront);
router.get('/book/:id', bookController.getBookDetails);
router.get('/book/:id/reviews/fragment', bookController.getReviewsFragment);
router.post('/book/:id/reviews', authMiddleware, bookController.createReview);
router.post('/book/:bookId/reviews/:reviewId/delete', authMiddleware, bookController.deleteReview);
router.post('/book/:bookId/reviews/:reviewId/edit', authMiddleware, bookController.updateReview);
router.get('/search', searchLimiter, bookController.searchBooks);
router.get('/api/search', searchLimiter, bookController.searchBooksAPI);

module.exports = router;
