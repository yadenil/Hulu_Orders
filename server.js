const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tableRoutes = require('./src/routes/tableRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const orderStatusRoutes = require('./src/routes/orderStatusRoutes');  // ADD THIS
const kitchenRoutes = require('./src/routes/kitchenRoutes');
const authRoutes = require('./src/routes/authRoutes');
const cashierRoutes = require('./src/routes/cashierRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/orders', orderStatusRoutes);  // ← Place BEFORE orderRoutes
app.use('/api/orders', orderRoutes);        // ← This handles POST /api/orders
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cashier', cashierRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});