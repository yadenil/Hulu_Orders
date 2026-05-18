const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get order status by order number (for customer tracking)
router.get('/:orderNumber/status', async (req, res) => {
    const { orderNumber } = req.params;

    if (!orderNumber) {
        return res.status(400).json({ success: false, error: 'Order number required' });
    }

    try {
        // Get order details with table and session info
        const [order] = await db.query(`
            SELECT 
                o.id,
                o.order_number,
                o.status,
                o.queue_type,
                o.placed_at,
                o.updated_at,
                s.total_bill as session_total,
                t.table_number
            FROM orders o
            JOIN sessions s ON o.session_id = s.id
            JOIN tables t ON s.table_id = t.id
            WHERE o.order_number = ?
        `, [orderNumber]);

        if (order.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Get items in this order
        const [items] = await db.query(`
            SELECT 
                oi.id,
                oi.quantity,
                oi.unit_price,
                oi.subtotal,
                oi.special_instructions,
                mi.item_name,
                mi.queue_type,
                mi.image_url
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ?
        `, [order[0].id]);

        // Calculate queue position (only for active orders)
        let queuePosition = null;
        if ((order[0].status === 'ORDERED' || order[0].status === 'PREPARING')) {
            const [queue] = await db.query(`
                SELECT COUNT(*) + 1 as position
                FROM orders o2
                WHERE o2.status IN ('ORDERED', 'PREPARING')
                  AND o2.placed_at < ?
            `, [order[0].placed_at]);
            queuePosition = queue[0]?.position || 1;
        }

        res.json({
            success: true,
            data: {
                order_number: order[0].order_number,
                status: order[0].status,
                queue_type: order[0].queue_type,
                queue_position: queuePosition,
                placed_at: order[0].placed_at,
                updated_at: order[0].updated_at,
                table_number: order[0].table_number,
                session_total: order[0].session_total,
                items: items
            }
        });

    } catch (error) {
        console.error('Order status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;