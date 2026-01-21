const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: 'Too Many Requests',
        message: 'You have exceeded the request limit. Please try again later.'
    }
});

// Stricter limiter for sensitive endpoints (e.g. upload)
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: {
        error: 'Too Many Uploads',
        message: 'Upload limit exceeded. Please try again later.'
    }
});

module.exports = {
    apiLimiter,
    uploadLimiter
};
