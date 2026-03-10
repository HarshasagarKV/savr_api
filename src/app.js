const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/orders.routes');
const notificationRoutes = require('./routes/notifications.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { successResponse } = require('./utils/apiResponse');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      errors: []
    }
  })
);

app.get('/health', (req, res) => successResponse(res, 'Server is healthy', { uptime: process.uptime() }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users/orders', orderRoutes);
app.use('/api/v1/users/notifications', notificationRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
