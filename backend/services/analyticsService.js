const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const incidentDetector = require('./incidentDetector');

/**
 * Aggregates events for a specific file into the AggregateMinute table
 */
exports.aggregateFileData = async (fileId) => {
    try {
        console.log(`📊 Starting aggregation for file: ${fileId}`);

        // This raw query performs the minute-by-minute aggregation and upserts into AggregateMinute
        // It handles: totalCount, delivered (tran), bounced (bounce/rb), deferred (acct with deferred status), complaints (fbl)
        // Latency avg/p95 (only for tran)

        await prisma.$executeRawUnsafe(`
            INSERT INTO "AggregateMinute" (
                "id",
                "timeBucket",
                "eventType",
                "jobId",
                "sender",
                "recipientDomain",
                "vmta",
                "totalCount",
                "delivered",
                "bounced",
                "deferred",
                "complaints",
                "avgLatencyMs",
                "p95LatencyMs"
            )
            SELECT 
                gen_random_uuid() as "id",
                DATE_TRUNC('minute', "eventTimestamp") as "timeBucket",
                "eventType",
                "jobId",
                "sender",
                "recipientDomain",
                "vmta",
                COUNT(*) as "totalCount",
                SUM(CASE WHEN "eventType" = 'tran' THEN 1 ELSE 0 END) as "delivered",
                SUM(CASE WHEN "eventType" IN ('bounce', 'rb') THEN 1 ELSE 0 END) as "bounced",
                SUM(CASE WHEN "eventType" = 'acct' AND "dsnAction" = 'delayed' THEN 1 ELSE 0 END) as "deferred",
                SUM(CASE WHEN "eventType" = 'fbl' THEN 1 ELSE 0 END) as "complaints",
                AVG(CASE WHEN "eventType" = 'tran' THEN CAST("deliveryLatency" AS FLOAT) * 1000 ELSE NULL END) as "avgLatencyMs",
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST("deliveryLatency" AS FLOAT) * 1000) as "p95LatencyMs"
            FROM "Event"
            WHERE "fileId" = '${fileId}'
              AND "eventTimestamp" IS NOT NULL
            GROUP BY 2, 3, 4, 5, 6, 7
            ON CONFLICT ("timeBucket", "eventType", "jobId", "sender", "recipientDomain", "vmta") 
            DO UPDATE SET
                "totalCount" = "AggregateMinute"."totalCount" + EXCLUDED."totalCount",
                "delivered" = "AggregateMinute"."delivered" + EXCLUDED."delivered",
                "bounced" = "AggregateMinute"."bounced" + EXCLUDED."bounced",
                "deferred" = "AggregateMinute"."deferred" + EXCLUDED."deferred",
                "complaints" = "AggregateMinute"."complaints" + EXCLUDED."complaints",
                "avgLatencyMs" = (COALESCE("AggregateMinute"."avgLatencyMs", 0) + COALESCE(EXCLUDED."avgLatencyMs", 0)) / 2,
                "p95LatencyMs" = GREATEST(COALESCE("AggregateMinute"."p95LatencyMs", 0), COALESCE(EXCLUDED."p95LatencyMs", 0));
        `);

        console.log(`✅ Aggregation completed for file: ${fileId}`);

        // After aggregation, update risk scores and run incident detection
        await this.updateRiskScores(fileId);
        await incidentDetector.detectIncidents();

    } catch (error) {
        console.error('❌ Aggregation Error:', error);
        throw error;
    }
};

/**
 * Updates risk scores based on the newly ingested file data
 */
exports.updateRiskScores = async (fileId) => {
    try {
        console.log(`🛡️ Updating risk scores for file: ${fileId}`);

        // 1. Calculate risks for Senders
        const senderRisks = await prisma.$queryRaw`
            SELECT 
                "sender" as "entityValue",
                CAST(COUNT(*) FILTER (WHERE "eventType" = 'fbl') AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE "eventType" = 'acct'), 0) * 100 as "complaintRate",
                CAST(COUNT(*) FILTER (WHERE "eventType" = 'bounce') AS FLOAT) / NULLIF(COUNT(*) FILTER (WHERE "eventType" = 'acct'), 0) * 100 as "bounceRate"
            FROM "Event"
            WHERE "fileId" = ${fileId} AND "sender" IS NOT NULL
            GROUP BY "sender"
        `;

        for (const sr of senderRisks) {
            const riskScore = Math.min(100, Math.round((sr.complaintRate || 0) * 40 + (sr.bounceRate || 0) * 10));
            const riskLevel = riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low';

            await prisma.riskScore.upsert({
                where: { entityType_entityValue: { entityType: 'user', entityValue: sr.entityValue } },
                update: {
                    riskScore,
                    riskLevel,
                    contributingFactors: { complaintRate: sr.complaintRate, bounceRate: sr.bounceRate },
                    calculatedAt: new Date()
                },
                create: {
                    entityType: 'user',
                    entityValue: sr.entityValue,
                    riskScore,
                    riskLevel,
                    contributingFactors: { complaintRate: sr.complaintRate, bounceRate: sr.bounceRate }
                }
            });
        }

        console.log(`✅ Risk scores updated for file: ${fileId}`);
    } catch (error) {
        console.error('❌ Risk Score Update Error:', error);
    }
};
