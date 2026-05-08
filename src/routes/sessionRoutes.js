const express = require('express');
const router = express.Router();
const db = require('../config/db');
// Temporary GET for testing
router.get('/', (req, res) => {
    res.json({ message: 'Session route is working! Use POST to create session.' });
}); 
// Get or create active session for a table
router.post('/', async (req, res) => {
    const { table_id } = req.body;
    
    if (!table_id) {
        return res.status(400).json({ success: false, error: 'Table ID required' });
    }
    
    try {
        // Check for existing active session
        let [session] = await db.query(
            'SELECT * FROM sessions WHERE table_id = ? AND bill_status = "ACTIVE"',
            [table_id]
        );
        
        if (session.length === 0) {
            // Create new session
            const sessionCode = `SESS_${Date.now()}_${table_id}`;
            const [result] = await db.query(
                'INSERT INTO sessions (session_code, table_id) VALUES (?, ?)',
                [sessionCode, table_id]
            );
            
            [session] = await db.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);
        } else {
            session = [session[0]];
        }
        
        res.json({ success: true, data: session[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;