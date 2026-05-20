const TableModel = require('../models/tableModel');

const TableController = {
    getAllTables: async (req, res) => {
        try {
            const tables = await TableModel.getAll();
            res.json({ success: true, data: tables });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = TableController;