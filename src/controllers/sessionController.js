const db = require('../config/db');
const SessionModel = require('../models/sessionModel');

const SessionController = {
    // Get or create active session
    getOrCreateSession: async (req, res) => {
        const { table_id } = req.body;

        if (!table_id) {
            return res.status(400).json({ success: false, error: 'Table ID required' });
        }

        try {
            let session = await SessionModel.getActiveByTable(table_id);
            if (!session) {
                session = await SessionModel.create(table_id);
            }
            res.json({ success: true, data: session });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = SessionController;