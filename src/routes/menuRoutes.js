const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, c.category_name 
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            WHERE m.is_available = 1
            ORDER BY c.sort_order, m.item_name
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;