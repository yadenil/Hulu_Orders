const OrderModel = require('../models/orderModel');
const db = require('../config/db');

const KitchenController = {
    getActiveOrders: async (req, res) => {
        try {
            const orders = await OrderModel.getActiveForKitchen();

            // Get items for each order
            for (let order of orders) {
                const [items] = await db.query(`
                    SELECT oi.*, mi.item_name 
                    FROM order_items oi
                    JOIN menu_items mi ON oi.menu_item_id = mi.id
                    WHERE oi.order_id = ?
                `, [order.id]);
                order.items = items;
            }

            res.json({ success: true, data: orders });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    updateOrderStatus: async (req, res) => {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['PREPARING', 'READY'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        try {
            await OrderModel.updateStatus(orderId, status, req.user?.id);
            res.json({ success: true, message: `Order status updated to ${status}` });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = KitchenController;