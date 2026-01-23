const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { validate, schemas } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const analytics = require('../services/analytics');

// Cached file count check
async function hasFiles() {
    const cacheKey = 'fileCount';
    let count = analytics.getCached(cacheKey);
    if (count === null) {
        count = await prisma.file.count();
        analytics.setCache(cacheKey, count, analytics.CACHE_TTL.fileCount);
    }
    return count > 0;
}

// Export cache invalidation for use in file controller
router.invalidateCache = analytics.invalidateCache;

// Export aggregated reports
router.get('/export', validate(schemas.analyticsQuery), asyncHandler(async (req, res) => {
    const { from, to, type = 'domain' } = req.query;
    const { csv, filename } = await analytics.generateExport(from, to, type);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csv);
}));

// Get aggregated stats
router.get('/stats', validate(schemas.analyticsQuery), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const stats = await analytics.getMessageStats(from, to);
    res.json(stats);
}));

// Get volume trends (grouped by hour)
router.get('/volume', validate(schemas.analyticsQuery), asyncHandler(async (req, res) => {
    if (!(await hasFiles())) {
        return res.json([]);
    }
    const { from, to } = req.query;
    const volumeTrend = await analytics.getVolumeTrends(from, to);
    res.json(volumeTrend);
}));

// Get latency trends (grouped by hour)
router.get('/latency', validate(schemas.analyticsQuery), asyncHandler(async (req, res) => {
    if (!(await hasFiles())) {
        return res.json([]);
    }
    const { from, to } = req.query;
    const latencyTrend = await analytics.getLatencyTrends(from, to);
    res.json(latencyTrend);
}));

// Get domain performance
router.get('/domains', validate(schemas.analyticsQuery), asyncHandler(async (req, res) => {
    if (!(await hasFiles())) {
        return res.json([]);
    }
    const { from, to } = req.query;
    const stats = await analytics.getDomainStats(from, to);
    res.json(stats);
}));

// Get sender performance and risk
router.get('/senders', validate(schemas.analyticsQuery), asyncHandler(async (req, res) => {
    if (!(await hasFiles())) {
        return res.json([]);
    }
    const { from, to } = req.query;
    const stats = await analytics.getSenderStats(from, to);
    res.json(stats);
}));

// Get automated insights/alerts
router.get('/insights', asyncHandler(async (req, res) => {
    const insights = await analytics.getInsights();
    res.json(insights);
}));

// Get incidents and timeline
router.get('/incidents', asyncHandler(async (req, res) => {
    const incidents = await analytics.getIncidents();
    res.json(incidents);
}));

module.exports = router;
