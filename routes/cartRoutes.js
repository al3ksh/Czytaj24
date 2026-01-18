const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addToCart);
router.post('/cart/increase', cartController.increaseItemQuantity);
router.post('/cart/decrease', cartController.decreaseItemQuantity);
router.post('/cart/remove', cartController.removeItemFromCart);
router.post('/cart/clear', cartController.clearCart);

module.exports = router;
