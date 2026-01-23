/**
 * Analytics services - barrel export
 */
const cacheService = require('./cacheService');
const statsService = require('./statsService');
const volumeService = require('./volumeService');
const latencyService = require('./latencyService');
const domainService = require('./domainService');
const senderService = require('./senderService');
const exportService = require('./exportService');
const insightService = require('./insightService');

module.exports = {
    // Cache utilities
    ...cacheService,

    // Statistics
    getMessageStats: statsService.getMessageStats,

    // Trends
    getVolumeTrends: volumeService.getVolumeTrends,
    getLatencyTrends: latencyService.getLatencyTrends,

    // Entity performance
    getDomainStats: domainService.getDomainStats,
    getSenderStats: senderService.getSenderStats,

    // Export
    generateExport: exportService.generateExport,

    // Insights & Incidents
    getInsights: insightService.getInsights,
    getIncidents: insightService.getIncidents
};
