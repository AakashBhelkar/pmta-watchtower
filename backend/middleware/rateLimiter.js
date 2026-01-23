const rateLimit = require('express-rate-limit');
const config = require('../config');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: config.rateLimit.api.windowMs,
    max: config.rateLimit.api.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too Many Requests',
        message: 'You have exceeded the request limit. Please try again later.'
    }
});

// Stricter limiter for sensitive endpoints (e.g. upload)
const uploadLimiter = rateLimit({
    windowMs: config.rateLimit.upload.windowMs,
    max: config.rateLimit.upload.maxRequests,
    message: {
        error: 'Too Many Uploads',
        message: 'Upload limit exceeded. Please try again later.'
    }
});

module.exports = {
    apiLimiter,
    uploadLimiter
};
