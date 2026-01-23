/**
 * Centralized Configuration Module
 *
 * This module consolidates all configurable values that were previously
 * hardcoded throughout the codebase. Values can be overridden via
 * environment variables.
 */

module.exports = {
    // Incident Detection Time Windows
    detection: {
        shortWindowMs: parseInt(process.env.DETECTION_SHORT_WINDOW_MS) || 15 * 60 * 1000,         // 15 minutes
        longWindowMs: parseInt(process.env.DETECTION_LONG_WINDOW_MS) || 24 * 60 * 60 * 1000,      // 24 hours
        complaintWindowMs: parseInt(process.env.DETECTION_COMPLAINT_WINDOW_MS) || 30 * 60 * 1000, // 30 minutes
        weeklyWindowMs: parseInt(process.env.DETECTION_WEEKLY_WINDOW_MS) || 7 * 24 * 60 * 60 * 1000, // 7 days
        alertCooldownMs: parseInt(process.env.ALERT_COOLDOWN_MS) || 30 * 60 * 1000               // 30 minutes
    },

    // Alert and Incident Thresholds
    thresholds: {
        baselineLatencyMs: parseInt(process.env.BASELINE_LATENCY_MS) || 500,
        throttlingMultiplier: parseFloat(process.env.THROTTLING_MULTIPLIER) || 1.5,
        highLatencyMs: parseInt(process.env.HIGH_LATENCY_MS) || 5000,
        complaintRate: parseFloat(process.env.COMPLAINT_RATE_THRESHOLD) || 0.01,    // 1%
        bounceRate: parseFloat(process.env.BOUNCE_RATE_THRESHOLD) || 0.2,           // 20%
        minEventsForBounce: parseInt(process.env.MIN_EVENTS_FOR_BOUNCE) || 10,      // Legacy
        minMessagesForBounce: parseInt(process.env.MIN_MESSAGES_FOR_BOUNCE) || 10   // Message-based threshold
    },

    // Risk Scoring Configuration
    riskScoring: {
        complaintWeight: parseInt(process.env.RISK_COMPLAINT_WEIGHT) || 40,
        bounceWeight: parseInt(process.env.RISK_BOUNCE_WEIGHT) || 20,
        maxScore: parseInt(process.env.RISK_MAX_SCORE) || 100,
        criticalThreshold: parseInt(process.env.RISK_CRITICAL_THRESHOLD) || 80,
        highThreshold: parseInt(process.env.RISK_HIGH_THRESHOLD) || 60,
        mediumThreshold: parseInt(process.env.RISK_MEDIUM_THRESHOLD) || 30
    },

    // Pagination Defaults
    pagination: {
        defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 50,
        maxLimit: parseInt(process.env.MAX_PAGE_LIMIT) || 100,
        insightsLimit: parseInt(process.env.INSIGHTS_LIMIT) || 20,
        incidentsLimit: parseInt(process.env.INCIDENTS_LIMIT) || 20,
        domainsLimit: parseInt(process.env.DOMAINS_LIMIT) || 100,
        sendersLimit: parseInt(process.env.SENDERS_LIMIT) || 100
    },

    // File Upload Configuration
    upload: {
        maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES) || 200 * 1024 * 1024, // 200MB
        bodyLimit: process.env.BODY_LIMIT || '50mb',
        batchSize: parseInt(process.env.INGESTION_BATCH_SIZE) || 1000,
        uploadsDir: process.env.UPLOADS_DIR || 'uploads'
    },

    // Rate Limiting Configuration
    rateLimit: {
        api: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,       // 15 minutes
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
        },
        upload: {
            windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
            maxRequests: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 20
        }
    },

    // CSV Parser Configuration
    csvParser: {
        fileTypeMatchThreshold: parseFloat(process.env.FILE_TYPE_MATCH_THRESHOLD) || 0.6  // 60%
    },

    // Cache Configuration
    cache: {
        insightsTtl: parseInt(process.env.CACHE_INSIGHTS_TTL) || 60 * 1000,     // 1 minute
        incidentsTtl: parseInt(process.env.CACHE_INCIDENTS_TTL) || 60 * 1000,   // 1 minute
        fileCountTtl: parseInt(process.env.CACHE_FILE_COUNT_TTL) || 30 * 1000,  // 30 seconds
        statsTtl: parseInt(process.env.CACHE_STATS_TTL) || 30 * 1000            // 30 seconds
    },

    // Server Configuration
    server: {
        port: parseInt(process.env.PORT) || 4000,
        corsOrigin: process.env.CORS_ORIGIN || '*',
        nodeEnv: process.env.NODE_ENV || 'development'
    }
};
