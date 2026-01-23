const prisma = require('../lib/prisma');
const incidentDetector = require('./incidentDetector');
const config = require('../config');

/**
 * Aggregates events for a specific file into the AggregateMinute table
 * Uses message-based counts (deduplicated by messageKey) and proper latency sum/count math
 */
exports.aggregateFileData = async (fileId) => {
    try {
        console.log(`Starting aggregation for file: ${fileId}`);

        // This raw query performs minute-by-minute aggregation with:
        // - Message-based counts using messageKey for deduplication
        // - Latency sum/count pattern for correct aggregation math
        // - Event-based counts retained for backwards compatibility

        await prisma.$queryRaw`
            INSERT INTO "AggregateMinute" (
                "id",
                "timeBucket",
                "eventType",
                "jobId",
                "sender",
                "recipientDomain",
                "vmta",
                "fileId",
                "totalCount",
                "delivered",
                "bounced",
                "deferred",
                "complaints",
                "messageAttempts",
                "deliveredMessages",
                "bouncedMessages",
                "complaintMessages",
                "latencySumMs",
                "latencyCount",
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
                ${fileId} as "fileId",
                -- Event-based counts (legacy)
                COUNT(*) as "totalCount",
                SUM(CASE WHEN "eventType" = 'tran' THEN 1 ELSE 0 END) as "delivered",
                SUM(CASE WHEN "eventType" IN ('bounce', 'rb') THEN 1 ELSE 0 END) as "bounced",
                SUM(CASE WHEN "eventType" = 'acct' AND "dsnAction" = 'delayed' THEN 1 ELSE 0 END) as "deferred",
                SUM(CASE WHEN "eventType" = 'fbl' THEN 1 ELSE 0 END) as "complaints",
                -- Message-based counts (deduplicated by messageKey)
                COUNT(DISTINCT "messageKey") as "messageAttempts",
                COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'tran') as "deliveredMessages",
                COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" IN ('bounce', 'rb')) as "bouncedMessages",
                COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'fbl') as "complaintMessages",
                -- Latency sum/count for correct aggregation
                COALESCE(SUM(CASE WHEN "eventType" = 'tran' AND "deliveryLatency" IS NOT NULL
                    THEN CAST("deliveryLatency" AS FLOAT) * 1000 ELSE 0 END), 0) as "latencySumMs",
                COUNT(CASE WHEN "eventType" = 'tran' AND "deliveryLatency" IS NOT NULL THEN 1 END) as "latencyCount",
                -- Legacy avg/p95 (computed for this batch only, not merged correctly on conflict)
                AVG(CASE WHEN "eventType" = 'tran' THEN CAST("deliveryLatency" AS FLOAT) * 1000 ELSE NULL END) as "avgLatencyMs",
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST("deliveryLatency" AS FLOAT) * 1000)
                    FILTER (WHERE "eventType" = 'tran' AND "deliveryLatency" IS NOT NULL) as "p95LatencyMs"
            FROM "Event"
            WHERE "fileId" = ${fileId}
              AND "eventTimestamp" IS NOT NULL
            GROUP BY 2, 3, 4, 5, 6, 7
            ON CONFLICT ("timeBucket", "eventType", "jobId", "sender", "recipientDomain", "vmta", "fileId")
            DO UPDATE SET
                -- Event-based counts: additive
                "totalCount" = "AggregateMinute"."totalCount" + EXCLUDED."totalCount",
                "delivered" = "AggregateMinute"."delivered" + EXCLUDED."delivered",
                "bounced" = "AggregateMinute"."bounced" + EXCLUDED."bounced",
                "deferred" = "AggregateMinute"."deferred" + EXCLUDED."deferred",
                "complaints" = "AggregateMinute"."complaints" + EXCLUDED."complaints",
                -- Message-based counts: additive (safe because fileId is part of unique constraint)
                "messageAttempts" = "AggregateMinute"."messageAttempts" + EXCLUDED."messageAttempts",
                "deliveredMessages" = "AggregateMinute"."deliveredMessages" + EXCLUDED."deliveredMessages",
                "bouncedMessages" = "AggregateMinute"."bouncedMessages" + EXCLUDED."bouncedMessages",
                "complaintMessages" = "AggregateMinute"."complaintMessages" + EXCLUDED."complaintMessages",
                -- Latency: sum/count are additive, then compute avg at query time
                "latencySumMs" = COALESCE("AggregateMinute"."latencySumMs", 0) + COALESCE(EXCLUDED."latencySumMs", 0),
                "latencyCount" = COALESCE("AggregateMinute"."latencyCount", 0) + COALESCE(EXCLUDED."latencyCount", 0),
                -- avgLatencyMs is now computed at query time from latencySumMs/latencyCount
                -- p95 cannot be merged correctly - leave as NULL for aggregate queries
                "avgLatencyMs" = CASE
                    WHEN (COALESCE("AggregateMinute"."latencyCount", 0) + COALESCE(EXCLUDED."latencyCount", 0)) > 0
                    THEN (COALESCE("AggregateMinute"."latencySumMs", 0) + COALESCE(EXCLUDED."latencySumMs", 0)) /
                         (COALESCE("AggregateMinute"."latencyCount", 0) + COALESCE(EXCLUDED."latencyCount", 0))
                    ELSE NULL END,
                "p95LatencyMs" = NULL
        `;

        console.log(`Aggregation completed for file: ${fileId}`);

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
 * Optimized with batch processing for better performance
 */
exports.updateRiskScores = async (fileId) => {
    try {
        console.log(`🛡️ Updating risk scores for file: ${fileId}`);

        // 1. Calculate risks for Senders using indexed messageKey for deduplication
        const senderRisks = await prisma.$queryRaw`
            SELECT
                "sender" AS "entityValue",
                COUNT(DISTINCT "messageKey") AS "messageAttempts",
                COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" = 'fbl') AS "complaintMessages",
                COUNT(DISTINCT "messageKey") FILTER (WHERE "eventType" IN ('bounce','rb')) AS "bouncedMessages"
            FROM "Event"
            WHERE "fileId" = ${fileId}
              AND "sender" IS NOT NULL
              AND "messageKey" IS NOT NULL
            GROUP BY "sender"
        `;

        // Process in batches of 50 using Promise.all for parallelism
        const BATCH_SIZE = 50;
        const batches = [];

        for (let i = 0; i < senderRisks.length; i += BATCH_SIZE) {
            batches.push(senderRisks.slice(i, i + BATCH_SIZE));
        }

        for (const batch of batches) {
            const upsertPromises = batch.map(sr => {
                const attempts = Number(sr.messageAttempts || 0);
                const complaintMessages = Number(sr.complaintMessages || 0);
                const bouncedMessages = Number(sr.bouncedMessages || 0);

                const complaintRate = attempts > 0 ? (complaintMessages / attempts) * 100 : 0;
                const bounceRate = attempts > 0 ? (bouncedMessages / attempts) * 100 : 0;

                // Risk score: complaints are heavily weighted, bounces moderately
                const rawScore = complaintRate * config.riskScoring.complaintWeight + bounceRate * config.riskScoring.bounceWeight;
                const riskScore = Math.min(config.riskScoring.maxScore, Math.round(rawScore));

                const riskLevel =
                    riskScore > config.riskScoring.criticalThreshold ? 'critical' :
                    riskScore > config.riskScoring.highThreshold ? 'high' :
                    riskScore > config.riskScoring.mediumThreshold ? 'medium' : 'low';

                return prisma.riskScore.upsert({
                    where: { entityType_entityValue: { entityType: 'user', entityValue: sr.entityValue } },
                    update: {
                        riskScore,
                        riskLevel,
                        contributingFactors: {
                            messageAttempts: attempts,
                            complaintMessages,
                            bouncedMessages,
                            complaintRate,
                            bounceRate,
                        },
                        calculatedAt: new Date()
                    },
                    create: {
                        entityType: 'user',
                        entityValue: sr.entityValue,
                        riskScore,
                        riskLevel,
                        contributingFactors: {
                            messageAttempts: attempts,
                            complaintMessages,
                            bouncedMessages,
                            complaintRate,
                            bounceRate,
                        }
                    }
                });
            });

            await Promise.all(upsertPromises);
        }

        console.log(`✅ Risk scores updated for file: ${fileId} (${senderRisks.length} senders)`);
    } catch (error) {
        console.error('❌ Risk Score Update Error:', error);
    }
};
