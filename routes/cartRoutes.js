const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/cart', authMiddleware, cartController.getCart);
router.post('/cart', authMiddleware, cartController.addToCart);
router.post('/cart/increase', authMiddleware, cartController.increaseItemQuantity);
router.post('/cart/decrease', authMiddleware, cartController.decreaseItemQuantity);
router.post('/cart/remove', authMiddleware, cartController.removeItemFromCart);
router.post('/cart/clear', authMiddleware, cartController.clearCart);

module.exports = router;
