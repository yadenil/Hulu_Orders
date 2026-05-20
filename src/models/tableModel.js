const db = require('../config/db');

const TableModel = {
    // Get all active tables
    getAll: async () => {
        const [rows] = await db.query(
            'SELECT * FROM tables WHERE is_active = 1 ORDER BY table_number'
        );
        return rows;
    },

    // Get table by ID
    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM tables WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = TableModel;