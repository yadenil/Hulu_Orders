const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');

router.post('/', SessionController.getOrCreateSession);

module.exports = router;