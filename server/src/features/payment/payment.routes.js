const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ message: '${feature} route' }));

module.exports = router;
