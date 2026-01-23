/**
 * Sender performance and risk service
 */
const prisma = require('../../lib/prisma');
const config = require('../../config');

/**
 * Get sender performance statistics with risk scores
 */
async function getSenderStats(from, to) {
    const fromDate = from ? new Date(from) : new Date('1970-01-01T00:00:00.000Z');
    const toDate = to ? new Date(to) : new Date('3000-01-01T00:00:00.000Z');
    const limit = config.pagination.maxLimit;

    // Use the indexed messageKey column for efficient deduplication
    const senderStats = await prisma.$queryRaw`
        SELECT
            "sender",
            COUNT(DISTINCT "messageKey") AS "messageAttempts",
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'tran') AS delivered,
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" IN ('bounce','rb')) AS bounced,
            COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'fbl') AS complaints,
            COUNT(DISTINCT "jobId") AS "jobCount",
            CASE WHEN COUNT(DISTINCT "messageKey") > 0
                 THEN (COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" IN ('bounce','rb'))::decimal / COUNT(DISTINCT "messageKey")) * 100
                 ELSE 0 END AS "bounceRate",
            CASE WHEN COUNT(DISTINCT "messageKey") > 0
                 THEN (COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'fbl')::decimal / COUNT(DISTINCT "messageKey")) * 100
                 ELSE 0 END AS "complaintRate"
        FROM "Event"
        WHERE "eventTimestamp" >= ${fromDate}
          AND "eventTimestamp" <= ${toDate}
          AND "sender" IS NOT NULL
          AND "messageKey" IS NOT NULL
        GROUP BY "sender"
        ORDER BY "messageAttempts" DESC
        LIMIT ${limit}
    `;

    // Fetch risk scores for all senders
    const riskScores = await prisma.riskScore.findMany({
        where: { entityType: 'user' }
    });

    const riskMap = riskScores.reduce((acc, curr) => {
        acc[curr.entityValue] = curr;
        return acc;
    }, {});

    return senderStats.map(s => {
        const risk = riskMap[s.sender] || { riskScore: 0, riskLevel: 'low' };
        return {
            sender: s.sender,
            messageAttempts: Number(s.messageAttempts || 0),
            delivered: Number(s.delivered || 0),
            bounced: Number(s.bounced || 0),
            complaints: Number(s.complaints || 0),
            jobCount: Number(s.jobCount || 0),
            bounceRate: s.bounceRate ? Number(s.bounceRate).toFixed(2) : '0.00',
            complaintRate: s.complaintRate ? Number(s.complaintRate).toFixed(2) : '0.00',
            riskScore: risk.riskScore,
            riskLevel: risk.riskLevel
        };
    });
}

module.exports = {
    getSenderStats
};
