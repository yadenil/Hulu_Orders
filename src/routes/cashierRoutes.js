const express = require('express');
const router = express.Router();
const CashierController = require('../controllers/cashierController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All cashier routes require authentication
router.use(authMiddleware);
router.use(roleMiddleware(['cashier', 'admin']));

router.get('/sessions', CashierController.getActiveSessions);
router.get('/sessions/:sessionId', CashierController.getSessionBill);
router.put('/sessions/:sessionId/complete', CashierController.completeSession);

module.exports = router;