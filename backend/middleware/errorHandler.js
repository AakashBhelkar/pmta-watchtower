/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error handling across the application:
 * - AppError class for operational errors with status codes
 * - asyncHandler wrapper to eliminate try-catch boilerplate
 * - Centralized error handler middleware
 */

const config = require('../config');

/**
 * Custom error class for operational errors
 */
class AppError extends Error {
    constructor(message, statusCode, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Common error factory methods
 */
const Errors = {
    badRequest: (message, code = 'BAD_REQUEST') => new AppError(message, 400, code),
    unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') => new AppError(message, 401, code),
    forbidden: (message = 'Forbidden', code = 'FORBIDDEN') => new AppError(message, 403, code),
    notFound: (message = 'Resource not found', code = 'NOT_FOUND') => new AppError(message, 404, code),
    conflict: (message = 'Resource already exists', code = 'CONFLICT') => new AppError(message, 409, code),
    validation: (message, details) => {
        const error = new AppError(message, 400, 'VALIDATION_ERROR');
        error.details = details;
        return error;
    },
    internal: (message = 'An unexpected error occurred', code = 'INTERNAL_ERROR') => new AppError(message, 500, code)
};

/**
 * Async handler wrapper to eliminate try-catch boilerplate
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    if (!err.isOperational) {
        console.error('Unhandled Error:', err);
    } else if (config.server.nodeEnv === 'development') {
        console.error('Operational Error:', err.message);
    }

    // Handle Prisma errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_RECORD',
                message: 'A record with this data already exists'
            },
            timestamp: new Date().toISOString()
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Record not found'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Handle validation errors (Joi)
    if (err.name === 'ValidationError' || err.isJoi) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
                details: err.details
            },
            timestamp: new Date().toISOString()
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.isOperational ? err.message : 'An unexpected error occurred'
        },
        timestamp: new Date().toISOString()
    };

    // Include stack trace in development
    if (config.server.nodeEnv === 'development' && err.stack) {
        response.error.stack = err.stack;
    }

    // Include details if present
    if (err.details) {
        response.error.details = err.details;
    }

    res.status(statusCode).json(response);
};

module.exports = {
    AppError,
    Errors,
    asyncHandler,
    errorHandler
};
