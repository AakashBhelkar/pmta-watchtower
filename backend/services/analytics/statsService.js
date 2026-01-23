/**
 * Message statistics service
 */
const prisma = require('../../lib/prisma');

/**
 * Get aggregated message statistics for a date range
 */
async function getMessageStats(from, to) {
    const whereEvents = {
        gte: from ? new Date(from) : new Date(0),
        lte: to ? new Date(to) : new Date()
    };

    // Use the indexed messageKey column for efficient deduplication
    const statsRows = await prisma.$queryRaw`
        SELECT
            COUNT(DISTINCT "messageKey") AS "messageAttempts",
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'tran') AS "deliveredMessages",
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" IN ('bounce','rb')) AS "bouncedMessages",
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'acct' AND "dsnAction" = 'delayed') AS "deferredMessages",
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'fbl') AS "complaintMessages",
            AVG("deliveryLatency") FILTER (WHERE "eventType" = 'tran') AS "avgLatencySeconds",
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "deliveryLatency") FILTER (WHERE "eventType" = 'tran') AS "p95LatencySeconds"
        FROM "Event"
        WHERE "eventTimestamp" >= ${whereEvents.gte}
          AND "eventTimestamp" <= ${whereEvents.lte}
          AND "messageKey" IS NOT NULL
    `;

    const statsRow = statsRows[0] || {};

    return {
        messageAttempts: Number(statsRow.messageAttempts || 0),
        deliveredMessages: Number(statsRow.deliveredMessages || 0),
        bouncedMessages: Number(statsRow.bouncedMessages || 0),
        deferredMessages: Number(statsRow.deferredMessages || 0),
        complaintMessages: Number(statsRow.complaintMessages || 0),
        avgLatency: statsRow.avgLatencySeconds ? Number(statsRow.avgLatencySeconds).toFixed(2) : 0,
        p95Latency: statsRow.p95LatencySeconds ? Number(statsRow.p95LatencySeconds).toFixed(2) : 0,
    };
}

module.exports = {
    getMessageStats
};
