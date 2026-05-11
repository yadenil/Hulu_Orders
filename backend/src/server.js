const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tableRoutes = require('./routes/tableRoutes');
const menuRoutes = require('./routes/menuRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const orderStatusRoutes = require('./routes/orderStatusRoutes');
const cashierRoutes = require('./routes/cashierRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tables', tableRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/order', orderStatusRoutes);  
app.use('/api/cashier', cashierRoutes);
app.use('/api/auth', authRoutes);
// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Test: http://localhost:${PORT}/api/test`);
    console.log(`📋 Tables: http://localhost:${PORT}/api/tables`);
    console.log(`📋 Menu: http://localhost:${PORT}/api/menu`); 
    console.log(`📋 Sessions: http://localhost:${PORT}/api/session`); 
    console.log(`📋 Orders: http://localhost:${PORT}/api/order`); 
    console.log(`📋 Kitchen: http://localhost:${PORT}/api/kitchen`); 
    console.log(`📋 Order Status: http://localhost:${PORT}/api/orders`); 
});