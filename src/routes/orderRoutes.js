const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');

// Place a new order
router.post('/', OrderController.placeOrder);

// Get order status by order number (for customer tracking)
router.get('/:orderNumber/status', OrderController.getOrderStatus);

module.exports = router;