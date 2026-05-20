const db = require('../config/db');

const OrderModel = {
    // Get next order number
    getNextOrderNumber: async () => {
        const [rows] = await db.query('SELECT MAX(order_number) as max_num FROM orders');
        return (rows[0]?.max_num || 104) + 1;
    },

    // Create new order
    create: async (data) => {
        const { order_number, session_id, table_id, queue_type } = data;
        const [result] = await db.query(
            'INSERT INTO orders (order_number, session_id, table_id, queue_type, status) VALUES (?, ?, ?, ?, "ORDERED")',
            [order_number, session_id, table_id, queue_type]
        );
        return result.insertId;
    },

    // Update order status
    updateStatus: async (orderId, status, changedBy = null) => {
        const [order] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
        const oldStatus = order[0]?.status;

        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

        await db.query(
            'INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
            [orderId, oldStatus, status, changedBy]
        );

        return true;
    },

    // Get active orders for kitchen
    getActiveForKitchen: async () => {
        const [rows] = await db.query(`
            SELECT o.*, t.table_number 
            FROM orders o
            JOIN sessions s ON o.session_id = s.id
            JOIN tables t ON s.table_id = t.id
            WHERE o.status IN ('ORDERED', 'PREPARING')
            ORDER BY o.placed_at ASC
        `);
        return rows;
    }
};

module.exports = OrderModel;