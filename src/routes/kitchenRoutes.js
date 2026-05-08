const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all active orders for kitchen
router.get('/orders', async (req, res) => {
    try {
        // Get all orders with status ORDERED or PREPARING
        const [orders] = await db.query(`
            SELECT 
                o.id,
                o.order_number,
                o.status,
                o.queue_type,
                o.placed_at,
                s.table_id,
                t.table_number,
                t.location
            FROM orders o
            JOIN sessions s ON o.session_id = s.id
            JOIN tables t ON s.table_id = t.id
            WHERE o.status IN ('ORDERED', 'PREPARING')
            ORDER BY o.placed_at ASC
        `);

        // Get items for each order
        for (let order of orders) {
            const [items] = await db.query(`
                SELECT 
                    oi.id,
                    oi.menu_item_id,
                    oi.quantity,
                    oi.unit_price,
                    oi.subtotal,
                    oi.special_instructions,
                    mi.item_name,
                    mi.queue_type
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = ?
            `, [order.id]);
            order.items = items;
        }

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Kitchen orders error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update order status (PREPARING or READY)
router.put('/orders/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PREPARING', 'READY'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid status. Must be PREPARING or READY' 
        });
    }

    try {
        // Get current status
        const [order] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
        
        if (order.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const oldStatus = order[0].status;

        // Update order status
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

        // Log status change in history
        await db.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) 
             VALUES (?, ?, ?, ?)`,
            [orderId, oldStatus, status, null]
        );

        res.json({ 
            success: true, 
            message: `Order ${orderId} status updated to ${status}` 
        });

    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;