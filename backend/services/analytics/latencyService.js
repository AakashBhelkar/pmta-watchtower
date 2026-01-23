/**
 * Latency metrics service
 */
const prisma = require('../../lib/prisma');

const DEFAULT_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get latency trends grouped by hour
 * Uses sum/count pattern for mathematically correct average calculation
 */
async function getLatencyTrends(from, to) {
    const latencyTrend = await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('hour', "timeBucket") as "time",
            CAST(
                CASE WHEN SUM("latencyCount") > 0
                     THEN SUM("latencySumMs") / SUM("latencyCount") / 1000
                     ELSE NULL END
            AS FLOAT) as "avgLatency",
            CAST(MAX("p95LatencyMs") / 1000 AS FLOAT) as "p95Latency",
            CAST(SUM("deliveredMessages") AS FLOAT) as "count"
        FROM "AggregateMinute"
        WHERE "eventType" = 'tran'
          AND "timeBucket" >= ${from ? new Date(from) : new Date(Date.now() - DEFAULT_LOOKBACK_MS)}
          AND "timeBucket" <= ${to ? new Date(to) : new Date()}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return latencyTrend;
}

module.exports = {
    getLatencyTrends
};
