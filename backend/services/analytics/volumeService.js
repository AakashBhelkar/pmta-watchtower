/**
 * Volume trends service
 */
const prisma = require('../../lib/prisma');

const DEFAULT_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get volume trends grouped by hour
 * Uses message-based counts for accurate deduplication
 */
async function getVolumeTrends(from, to) {
    const volumeTrend = await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('hour', "timeBucket") as "time",
            CAST(SUM("messageAttempts") AS FLOAT) as "sent",
            CAST(SUM("deliveredMessages") AS FLOAT) as "delivered",
            CAST(SUM("bouncedMessages") AS FLOAT) as "bounced",
            CAST(SUM("deferred") AS FLOAT) as "deferred"
        FROM "AggregateMinute"
        WHERE "timeBucket" >= ${from ? new Date(from) : new Date(Date.now() - DEFAULT_LOOKBACK_MS)}
          AND "timeBucket" <= ${to ? new Date(to) : new Date()}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return volumeTrend;
}

module.exports = {
    getVolumeTrends
};
