const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Staff login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and password required' 
        });
    }

    try {
        // Find staff by email
        const [staff] = await db.query(
            'SELECT * FROM staff WHERE email = ? AND is_active = 1',
            [email]
        );

        if (staff.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        const user = staff[0];

        // Compare password (for now, plain text. We'll fix later)
        if (password !== user.password_hash) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                name: user.full_name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Update last login time
        await db.query(
            'UPDATE staff SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Send response (don't send password)
        res.json({
            success: true,
            token: token,
            staff: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify token (check if user is still logged in)
router.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ 
            success: true, 
            user: decoded 
        });
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            error: 'Invalid or expired token' 
        });
    }
});

module.exports = router;