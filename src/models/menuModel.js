const db = require('../config/db');

const MenuModel = {
    // Get all available menu items
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT m.*, c.category_name 
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            WHERE m.is_available = 1
            ORDER BY c.sort_order, m.item_name
        `);
        return rows;
    },

    // Get menu item by ID
    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = MenuModel;