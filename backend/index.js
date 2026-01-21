require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

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
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

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
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details
        });
    }

    if (err.code === 'P2002') {
        return res.status(409).json({
            error: 'Conflict',
            message: 'A record with this data already exists'
        });
    }

    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        timestamp: new Date()
    });
});

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
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, prisma, server };

