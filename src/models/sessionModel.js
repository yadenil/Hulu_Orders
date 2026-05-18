const db = require('../config/db');

const SessionModel = {
    // Get active session by table
    getActiveByTable: async (tableId) => {
        const [rows] = await db.query(
            'SELECT * FROM sessions WHERE table_id = ? AND bill_status = "ACTIVE"',
            [tableId]
        );
        return rows[0];
    },

    // Create new session
    create: async (tableId) => {
        const sessionCode = `SESS_${Date.now()}_${tableId}`;
        const [result] = await db.query(
            'INSERT INTO sessions (session_code, table_id) VALUES (?, ?)',
            [sessionCode, tableId]
        );
        const [rows] = await db.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);
        return rows[0];
    },

    // Update session total
    updateTotal: async (sessionId, amount) => {
        await db.query('UPDATE sessions SET total_bill = total_bill + ? WHERE id = ?', [amount, sessionId]);
    }
};

module.exports = SessionModel;