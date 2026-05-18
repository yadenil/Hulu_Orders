const MenuModel = require('../models/menuModel');

const MenuController = {
    getMenu: async (req, res) => {
        try {
            const menu = await MenuModel.getAll();
            res.json({ success: true, data: menu });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = MenuController;