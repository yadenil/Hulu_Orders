const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

router.get('/', MenuController.getMenu);

module.exports = router;