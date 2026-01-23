require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const prisma = require('./lib/prisma');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin: config.server.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

app.use(express.json({ limit: config.upload.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.upload.bodyLimit }));
app.use(morgan(config.server.nodeEnv === 'development' ? 'dev' : 'combined'));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: '🚀 PMTA Watchtower API is running',
        docs: '/api',
        health: '/health'
    });
});

// Routes
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health check
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            timestamp: new Date(),
            database: 'connected',
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// API Documentation
app.get('/api', (req, res) => {
    res.json({
        name: 'PMTA Watchtower API',
        version: '1.0.0',
        endpoints: {
            files: '/api/files',
            events: '/api/events',
            analytics: '/api/analytics',
            health: '/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        },
        timestamp: new Date().toISOString()
    });
});

// Centralized error handling middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    try {
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 PMTA Watchtower Backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.server.nodeEnv}`);
});

module.exports = { app, prisma, server };

