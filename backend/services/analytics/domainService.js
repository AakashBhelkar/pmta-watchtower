/**
 * Domain performance service
 */
const prisma = require('../../lib/prisma');
const config = require('../../config');

/**
 * Get domain performance statistics
 */
async function getDomainStats(from, to) {
    const fromDate = from ? new Date(from) : new Date('1970-01-01T00:00:00.000Z');
    const toDate = to ? new Date(to) : new Date('3000-01-01T00:00:00.000Z');
    const limit = config.pagination.maxLimit;

    // Use the indexed messageKey column for efficient deduplication
    const domainStats = await prisma.$queryRaw`
        SELECT
            "recipientDomain" AS domain,
            COUNT(DISTINCT "messageKey") AS "messageAttempts",
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'tran') AS delivered,
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" IN ('bounce','rb')) AS bounced,
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'fbl') AS complaints,
            AVG("deliveryLatency") FILTER (WHERE "eventType" = 'tran') AS "avgLatencySeconds"
        FROM "Event"
        WHERE "eventTimestamp" >= ${fromDate}
          AND "eventTimestamp" <= ${toDate}
          AND "recipientDomain" IS NOT NULL
          AND "messageKey" IS NOT NULL
        GROUP BY "recipientDomain"
        ORDER BY "messageAttempts" DESC
        LIMIT ${limit}
    `;

    return domainStats.map(d => ({
        domain: d.domain,
        messageAttempts: Number(d.messageAttempts || 0),
        delivered: Number(d.delivered || 0),
        bounced: Number(d.bounced || 0),
        complaints: Number(d.complaints || 0),
        avgLatency: d.avgLatencySeconds ? Number(d.avgLatencySeconds).toFixed(2) : 0
    }));
}

module.exports = {
    getDomainStats
};
