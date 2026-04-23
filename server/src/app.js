const express = require('express');
const cors = require('./config/cors');
const orderingRoutes = require('./features/ordering/ordering.routes');
const menuRoutes = require('./features/menu/menu.routes');
const tableRoutes = require('./features/table/table.routes');
const paymentRoutes = require('./features/payment/payment.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/ordering', orderingRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/payment', paymentRoutes);
app.use(errorHandler);

module.exports = app;
