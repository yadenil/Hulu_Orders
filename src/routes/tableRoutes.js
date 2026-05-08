const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all tables
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tables WHERE is_active = 1 ORDER BY table_number');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;