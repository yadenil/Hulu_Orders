const db = require('../config/db');
const SessionModel = require('../models/sessionModel');
const OrderModel = require('../models/orderModel');
const MenuModel = require('../models/menuModel');

const OrderController = {
    placeOrder: async (req, res) => {
        const { table_id, items } = req.body;

        if (!table_id || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Table ID and items required' });
        }

        try {
            let session = await SessionModel.getActiveByTable(table_id);
            if (!session) {
                session = await SessionModel.create(table_id);
            }

            const orderNumber = await OrderModel.getNextOrderNumber();
            let hasHot = false;
            let orderTotal = 0;

            for (const item of items) {
                const menuItem = await MenuModel.getById(item.menu_item_id);
                if (menuItem.queue_type === 'hot') hasHot = true;
                orderTotal += menuItem.price * item.quantity;
            }

            const queueType = hasHot ? 'hot' : 'other';
            const orderId = await OrderModel.create({
                order_number: orderNumber,
                session_id: session.id,
                table_id: table_id,
                queue_type: queueType
            });

            for (const item of items) {
                const menuItem = await MenuModel.getById(item.menu_item_id);
                await db.query(
                    'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, special_instructions) VALUES (?, ?, ?, ?, ?, ?)',
                    [orderId, item.menu_item_id, item.quantity, menuItem.price, menuItem.price * item.quantity, item.special_instructions || null]
                );
            }

            await SessionModel.updateTotal(session.id, orderTotal);

            res.json({
                success: true,
                order_number: orderNumber,
                order_id: orderId,
                total: orderTotal
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    getOrderStatus: async (req, res) => {
        const { orderNumber } = req.params;

        try {
            const [order] = await db.query(`
                SELECT o.*, t.table_number 
                FROM orders o
                JOIN sessions s ON o.session_id = s.id
                JOIN tables t ON s.table_id = t.id
                WHERE o.order_number = ?
            `, [orderNumber]);

            if (order.length === 0) {
                return res.status(404).json({ success: false, error: 'Order not found' });
            }

            const [items] = await db.query(`
                SELECT oi.*, mi.item_name 
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = ?
            `, [order[0].id]);

            res.json({ success: true, data: { ...order[0], items } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = OrderController;