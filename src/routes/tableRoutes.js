const express = require('express');
const router = express.Router();
const TableController = require('../controllers/tableController');

router.get('/', TableController.getAllTables);

module.exports = router;