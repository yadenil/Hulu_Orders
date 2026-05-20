const jwt = require('jsonwebtoken');
const db = require('../config/db');

const AuthController = {
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }

        try {
            const [staff] = await db.query(
                'SELECT * FROM staff WHERE email = ? AND is_active = 1',
                [email]
            );

            if (staff.length === 0) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            const user = staff[0];

            if (password !== user.password_hash) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, name: user.full_name },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '8h' }
            );

            res.json({
                success: true,
                token,
                staff: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = AuthController;