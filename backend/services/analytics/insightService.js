/**
 * Insights and alerts service
 */
const prisma = require('../../lib/prisma');
const { getCached, setCache, CACHE_TTL } = require('./cacheService');

/**
 * Get automated insights from open alerts
 */
async function getInsights() {
    const cacheKey = 'insights';
    let insights = getCached(cacheKey);

    if (!insights) {
        const alerts = await prisma.alert.findMany({
            where: { status: 'open' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        insights = alerts.map(alert => ({
            id: alert.id,
            type: alert.severity === 'critical' || alert.severity === 'high' ? 'warning' : 'info',
            title: alert.alertType.charAt(0) + alert.alertType.slice(1).toLowerCase().replace('_', ' '),
            description: alert.summary,
            icon: alert.alertType === 'THROTTLING' ? 'mdi:clock-alert' : 'mdi:alert-decagram',
            createdAt: alert.createdAt
        }));

        setCache(cacheKey, insights, CACHE_TTL.insights);
    }

    return insights;
}

/**
 * Get incidents with their related alerts
 */
async function getIncidents() {
    const cacheKey = 'incidents';
    let incidents = getCached(cacheKey);

    if (!incidents) {
        incidents = await prisma.incident.findMany({
            include: { alerts: true },
            orderBy: { startTime: 'desc' },
            take: 20
        });
        setCache(cacheKey, incidents, CACHE_TTL.incidents);
    }

    return incidents;
}

module.exports = {
    getInsights,
    getIncidents
};
