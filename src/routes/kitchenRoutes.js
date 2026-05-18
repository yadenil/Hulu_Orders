const express = require('express');
const router = express.Router();
const KitchenController = require('../controllers/kitchenController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All kitchen routes require authentication
router.use(authMiddleware);
router.use(roleMiddleware(['kitchen', 'admin']));

router.get('/orders', KitchenController.getActiveOrders);
router.put('/orders/:orderId/status', KitchenController.updateOrderStatus);

module.exports = router;