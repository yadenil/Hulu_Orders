const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get order status by order number
router.get('/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;

    try {
        // Get order details
        const [orders] = await db.query(`
            SELECT 
                o.id,
                o.order_number,
                o.status,
                o.queue_type,
                o.placed_at,
                o.updated_at,
                s.table_id,
                t.table_number,
                s.total_bill as session_total
            FROM orders o
            JOIN sessions s ON o.session_id = s.id
            JOIN tables t ON s.table_id = t.id
            WHERE o.order_number = ?
        `, [orderNumber]);

        if (orders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        const order = orders[0];

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
        `, [order.id]);

        // Calculate queue position (only for active orders)
        let queuePosition = null;
        if (order.status === 'ORDERED' || order.status === 'PREPARING') {
            const [queue] = await db.query(`
                SELECT COUNT(*) + 1 as position
                FROM orders o2
                WHERE o2.status IN ('ORDERED', 'PREPARING')
                  AND o2.queue_type = ?
                  AND o2.placed_at < ?
            `, [order.queue_type, order.placed_at]);
            queuePosition = queue[0]?.position || 1;
        }

        res.json({
            success: true,
            data: {
                order_number: order.order_number,
                status: order.status,
                queue_type: order.queue_type,
                queue_position: queuePosition,
                placed_at: order.placed_at,
                updated_at: order.updated_at,
                table_number: order.table_number,
                session_total: order.session_total,
                items: items
            }
        });

    } catch (error) {
        console.error('Order status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;