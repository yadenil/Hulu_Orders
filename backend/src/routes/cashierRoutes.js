const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Get all active sessions (tables with unpaid bills)
router.get('/sessions', async (req, res) => {
    try {
        const [sessions] = await db.query(`
            SELECT 
                s.id,
                s.session_code,
                s.table_id,
                s.total_bill,
                s.started_at,
                t.table_number,
                t.location,
                COUNT(DISTINCT o.id) as order_count
            FROM sessions s
            JOIN tables t ON s.table_id = t.id
            LEFT JOIN orders o ON s.id = o.session_id
            WHERE s.bill_status = 'ACTIVE'
            GROUP BY s.id
            ORDER BY s.started_at ASC
        `);

        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Get full bill details for a specific session
router.get('/sessions/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Get session info
        const [session] = await db.query(`
            SELECT 
                s.id,
                s.session_code,
                s.table_id,
                s.total_bill,
                s.started_at,
                t.table_number,
                t.location
            FROM sessions s
            JOIN tables t ON s.table_id = t.id
            WHERE s.id = ? AND s.bill_status = 'ACTIVE'
        `, [sessionId]);

        if (session.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Session not found or already completed' 
            });
        }

        // Get all orders in this session
        const [orders] = await db.query(`
            SELECT 
                o.id,
                o.order_number,
                o.status,
                o.placed_at,
                o.updated_at
            FROM orders o
            WHERE o.session_id = ?
            ORDER BY o.placed_at ASC
        `, [sessionId]);

        // Get items for each order
        for (let order of orders) {
            const [items] = await db.query(`
                SELECT 
                    oi.id,
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
            
            // Calculate order total
            order.order_total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        }

        res.json({
            success: true,
            data: {
                session: session[0],
                orders: orders,
                total_bill: parseFloat(session[0].total_bill)
            }
        });

    } catch (error) {
        console.error('Get session details error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Mark session as COMPLETED (after payment)
router.put('/sessions/:sessionId/complete', async (req, res) => {
    const { sessionId } = req.params;
    const { payment_method = 'cash' } = req.body;

    try {
        // Check if session exists and is ACTIVE
        const [session] = await db.query(
            'SELECT * FROM sessions WHERE id = ? AND bill_status = "ACTIVE"',
            [sessionId]
        );

        if (session.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Session not found or already completed' 
            });
        }

        // Generate transaction number
        const transactionNumber = `TXN_${Date.now()}_${sessionId}`;

        // Create transaction record
        await db.query(`
            INSERT INTO transactions 
            (transaction_number, session_id, cashier_id, amount, payment_method) 
            VALUES (?, ?, ?, ?, ?)
        `, [transactionNumber, sessionId, 3, session[0].total_bill, payment_method]);

        // Mark session as COMPLETED
        await db.query(`
            UPDATE sessions 
            SET bill_status = 'COMPLETED', 
                completed_at = NOW(), 
                closed_at = NOW() 
            WHERE id = ?
        `, [sessionId]);

        // Update table status to available
        await db.query(
            'UPDATE tables SET status = "available" WHERE id = ?',
            [session[0].table_id]
        );

        res.json({
            success: true,
            message: 'Session completed successfully',
            transaction_number: transactionNumber,
            amount_paid: session[0].total_bill
        });

    } catch (error) {
        console.error('Complete session error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;