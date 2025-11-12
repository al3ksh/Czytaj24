const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/orders', authMiddleware, orderController.getOrders);
router.get('/order', authMiddleware, orderController.showOrder);
router.post('/order/confirm', authMiddleware, orderController.confirmOrder);
router.post('/orders/cancel/:id', authMiddleware, orderController.cancelOrder);
router.post('/orders/delete/:id', authMiddleware, orderController.deleteOrder);
router.get('/order/success', authMiddleware, orderController.orderSuccess);

module.exports = router;
