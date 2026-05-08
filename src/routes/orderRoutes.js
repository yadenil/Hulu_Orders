const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Place a new order
router.post('/', async (req, res) => {
    const { table_id, items } = req.body;

    // Validation
    if (!table_id) {
        return res.status(400).json({ success: false, error: 'Table ID required' });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'No items in order' });
    }

    try {
        // 1. Get or create active session
        let [session] = await db.query(
            'SELECT * FROM sessions WHERE table_id = ? AND bill_status = "ACTIVE"',
            [table_id]
        );

        if (session.length === 0) {
            // Create new session
            const sessionCode = `SESS_${Date.now()}_${table_id}`;
            const [result] = await db.query(
                'INSERT INTO sessions (session_code, table_id) VALUES (?, ?)',
                [sessionCode, table_id]
            );
            [session] = await db.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);
        } else {
            session = [session[0]];
        }

        const sessionId = session[0].id;

        // 2. Get next order number
        const [lastOrder] = await db.query('SELECT MAX(order_number) as max_num FROM orders');
        const nextOrderNumber = (lastOrder[0]?.max_num || 104) + 1;

        // 3. Determine order type and calculate total
        let hasHot = false;
        let hasDrink = false;
        let hasPrepared = false;
        let orderTotal = 0;

        for (const item of items) {
            const [menuItem] = await db.query(
                'SELECT price, queue_type FROM menu_items WHERE id = ?',
                [item.menu_item_id]
            );

            if (!menuItem.length) {
                return res.status(400).json({
                    success: false,
                    error: `Menu item ${item.menu_item_id} not found`
                });
            }

            const itemPrice = menuItem[0].price;
            const itemType = menuItem[0].queue_type;

            if (itemType === 'hot') hasHot = true;
            else if (itemType === 'drinks') hasDrink = true;
            else if (itemType === 'prepared') hasPrepared = true;

            orderTotal += itemPrice * item.quantity;
        }

        let orderType = '';
        if (hasHot) orderType = 'hot';
        else if (hasDrink) orderType = 'drinks';
        else if (hasPrepared) orderType = 'prepared';

        // 4. Create the order
        const [orderResult] = await db.query(
            `INSERT INTO orders 
            (order_number, session_id, table_id, queue_type, status) 
            VALUES (?, ?, ?, ?, 'ORDERED')`,
            [nextOrderNumber, sessionId, table_id, orderType]
        );

        const orderId = orderResult.insertId;

        // 5. Add each item to order_items
        for (const item of items) {
            const [menuItem] = await db.query(
                'SELECT price, queue_type, item_name FROM menu_items WHERE id = ?',
                [item.menu_item_id]
            );

            const unitPrice = menuItem[0].price;
            const subtotal = unitPrice * item.quantity;

            await db.query(
                `INSERT INTO order_items 
                (order_id, menu_item_id, quantity, unit_price, subtotal, special_instructions) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.menu_item_id, item.quantity, unitPrice, subtotal, item.special_instructions || null]
            );
        }

        // 6. Update session total bill
        await db.query('UPDATE sessions SET total_bill = total_bill + ? WHERE id = ?', [orderTotal, sessionId]);

        // 7. Return success response
        res.json({
            success: true,
            order_id: orderId,
            order_number: nextOrderNumber,
            session_id: sessionId,
            total: orderTotal
        });

    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;