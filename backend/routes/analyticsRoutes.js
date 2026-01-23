const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Parser } = require('json2csv');

const { validate, schemas } = require('../middleware/validate');

// Export aggregated reports
router.get('/export', validate(schemas.analyticsQuery), async (req, res) => {
    try {
        const { from, to, type = 'domain' } = req.query;
        const where = {
            timeBucket: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            }
        };

        let data = [];
        let fields = [];

        if (type === 'domain') {
            const domainStats = await prisma.aggregateMinute.groupBy({
                by: ['recipientDomain'],
                _sum: { totalCount: true, delivered: true, bounced: true, complaints: true },
                _avg: { avgLatencyMs: true },
                where
            });
            data = domainStats.map(d => ({
                Domain: d.recipientDomain,
                Total: d._sum.totalCount,
                Delivered: d._sum.delivered,
                Bounced: d._sum.bounced,
                Complaints: d._sum.complaints,
                'Avg Latency (s)': (d._avg.avgLatencyMs / 1000).toFixed(2)
            }));
            fields = ['Domain', 'Total', 'Delivered', 'Bounced', 'Complaints', 'Avg Latency (s)'];
        } else if (type === 'sender') {
            const senderStats = await prisma.aggregateMinute.groupBy({
                by: ['sender'],
                _sum: { totalCount: true, delivered: true, bounced: true, complaints: true },
                where
            });
            data = senderStats.map(s => ({
                Sender: s.sender,
                Total: s._sum.totalCount,
                Delivered: s._sum.delivered,
                Bounced: s._sum.bounced,
                Complaints: s._sum.complaints
            }));
            fields = ['Sender', 'Total', 'Delivered', 'Bounced', 'Complaints'];
        }

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=pmta_report_${type}_${Date.now()}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to generate export' });
    }
});



// Get aggregated stats
router.get('/stats', validate(schemas.analyticsQuery), async (req, res) => {
    try {
        const { from, to } = req.query;
        const whereEvents = {
            eventTimestamp: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            }
        };

        // Message-attempt-based metrics derived directly from Event to avoid double-counting
        const statsRows = await prisma.$queryRaw`
            WITH filtered AS (
                SELECT
                    COALESCE("messageId", CONCAT_WS(':', "jobId", "recipient")) AS message_key,
                    "eventType",
                    "dsnAction",
                    "deliveryLatency",
                    "eventTimestamp"
                FROM "Event"
                WHERE "eventTimestamp" >= ${whereEvents.eventTimestamp.gte || new Date(0)}
                  AND "eventTimestamp" <= ${whereEvents.eventTimestamp.lte || new Date()}
            )
            SELECT
                COUNT(DISTINCT message_key) AS "messageAttempts",
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'tran') AS "deliveredMessages",
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" IN ('bounce','rb')) AS "bouncedMessages",
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'acct' AND "dsnAction" = 'delayed') AS "deferredMessages",
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'fbl') AS "complaintMessages",
                AVG("deliveryLatency") FILTER (WHERE "eventType" = 'tran') AS "avgLatencySeconds",
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "deliveryLatency") FILTER (WHERE "eventType" = 'tran') AS "p95LatencySeconds"
            FROM filtered;
        `;

        const statsRow = statsRows[0] || {};

        res.json({
            messageAttempts: Number(statsRow.messageAttempts || 0),
            deliveredMessages: Number(statsRow.deliveredMessages || 0),
            bouncedMessages: Number(statsRow.bouncedMessages || 0),
            deferredMessages: Number(statsRow.deferredMessages || 0),
            complaintMessages: Number(statsRow.complaintMessages || 0),
            avgLatency: statsRow.avgLatencySeconds ? Number(statsRow.avgLatencySeconds).toFixed(2) : 0,
            p95Latency: statsRow.p95LatencySeconds ? Number(statsRow.p95LatencySeconds).toFixed(2) : 0,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get volume trends (grouped by hour)
router.get('/volume', validate(schemas.analyticsQuery), async (req, res) => {
    try {
        const fileCount = await prisma.file.count();
        if (fileCount === 0) {
            return res.json([]);
        }

        const { from, to } = req.query;
        const volumeTrend = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('hour', "timeBucket") as "time",
                CAST(SUM("totalCount") AS FLOAT) as "sent",
                CAST(SUM("delivered") AS FLOAT) as "delivered",
                CAST(SUM("bounced") AS FLOAT) as "bounced",
                CAST(SUM("deferred") AS FLOAT) as "deferred"
            FROM "AggregateMinute"
            WHERE "timeBucket" >= ${from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
              AND "timeBucket" <= ${to ? new Date(to) : new Date()}
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        res.json(volumeTrend);
    } catch (error) {
        console.error('Volume Trend Error:', error);
        res.status(500).json({ error: 'Failed to fetch volume data' });
    }
});

// Get latency trends (grouped by hour)
router.get('/latency', validate(schemas.analyticsQuery), async (req, res) => {
    try {
        const fileCount = await prisma.file.count();
        if (fileCount === 0) {
            return res.json([]);
        }

        const { from, to } = req.query;
        const latencyTrend = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('hour', "timeBucket") as "time",
                CAST(AVG("avgLatencyMs") / 1000 AS FLOAT) as "avgLatency",
                CAST(MAX("p95LatencyMs") / 1000 AS FLOAT) as "p95Latency",
                CAST(SUM("totalCount") AS FLOAT) as "count"
            FROM "AggregateMinute"
            WHERE "eventType" = 'tran'
              AND "timeBucket" >= ${from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
              AND "timeBucket" <= ${to ? new Date(to) : new Date()}
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        res.json(latencyTrend);
    } catch (error) {
        console.error('Latency Trend Error:', error);
        res.status(500).json({ error: 'Failed to fetch latency data' });
    }
});

// Get domain performance
router.get('/domains', validate(schemas.analyticsQuery), async (req, res) => {
    try {
        const fileCount = await prisma.file.count();
        if (fileCount === 0) {
            return res.json([]);
        }

        const { from, to } = req.query;
        const fromDate = from ? new Date(from).toISOString() : '1970-01-01T00:00:00.000Z';
        const toDate = to ? new Date(to).toISOString() : '3000-01-01T00:00:00.000Z';

        const domainStats = await prisma.$queryRawUnsafe(`
            WITH filtered AS (
                SELECT
                    "recipientDomain",
                    COALESCE("messageId", CONCAT_WS(':', "jobId", "recipient")) AS message_key,
                    "eventType",
                    "deliveryLatency"
                FROM "Event"
                WHERE "eventTimestamp" >= '${fromDate}'
                  AND "eventTimestamp" <= '${toDate}'
                  AND "recipientDomain" IS NOT NULL
            )
            SELECT
                "recipientDomain" AS domain,
                COUNT(DISTINCT message_key) AS "messageAttempts",
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'tran') AS delivered,
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" IN ('bounce','rb')) AS bounced,
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'fbl') AS complaints,
                AVG("deliveryLatency") FILTER (WHERE "eventType" = 'tran') AS "avgLatencySeconds"
            FROM filtered
            GROUP BY "recipientDomain"
            ORDER BY "messageAttempts" DESC
            LIMIT 100;
        `);

        const stats = domainStats.map(d => ({
            domain: d.domain,
            messageAttempts: Number(d.messageAttempts || 0),
            delivered: Number(d.delivered || 0),
            bounced: Number(d.bounced || 0),
            complaints: Number(d.complaints || 0),
            avgLatency: d.avgLatencySeconds ? Number(d.avgLatencySeconds).toFixed(2) : 0
        }));

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch domain stats' });
    }
});

// Get sender performance and risk
router.get('/senders', validate(schemas.analyticsQuery), async (req, res) => {
    try {
        const fileCount = await prisma.file.count();
        if (fileCount === 0) {
            return res.json([]);
        }

        const { from, to } = req.query;
        const fromDate = from ? new Date(from).toISOString() : '1970-01-01T00:00:00.000Z';
        const toDate = to ? new Date(to).toISOString() : '3000-01-01T00:00:00.000Z';

        const senderStats = await prisma.$queryRawUnsafe(`
            WITH filtered AS (
                SELECT
                    "sender",
                    COALESCE("messageId", CONCAT_WS(':', "jobId", "recipient")) AS message_key,
                    "eventType",
                    "jobId"
                FROM "Event"
                WHERE "eventTimestamp" >= '${fromDate}'
                  AND "eventTimestamp" <= '${toDate}'
                  AND "sender" IS NOT NULL
            )
            SELECT
                "sender",
                COUNT(DISTINCT message_key) AS "messageAttempts",
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'tran') AS delivered,
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" IN ('bounce','rb')) AS bounced,
                COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'fbl') AS complaints,
                COUNT(DISTINCT "jobId") AS "jobCount",
                CASE WHEN COUNT(DISTINCT message_key) > 0
                     THEN (COUNT(DISTINCT message_key) FILTER (WHERE "eventType" IN ('bounce','rb'))::decimal / COUNT(DISTINCT message_key)) * 100
                     ELSE 0 END AS "bounceRate",
                CASE WHEN COUNT(DISTINCT message_key) > 0
                     THEN (COUNT(DISTINCT message_key) FILTER (WHERE "eventType" = 'fbl')::decimal / COUNT(DISTINCT message_key)) * 100
                     ELSE 0 END AS "complaintRate"
            FROM filtered
            GROUP BY "sender"
            ORDER BY "messageAttempts" DESC
            LIMIT 100;
        `);

        const riskScores = await prisma.riskScore.findMany({
            where: { entityType: 'user' }
        });

        const riskMap = riskScores.reduce((acc, curr) => {
            acc[curr.entityValue] = curr;
            return acc;
        }, {});

        const stats = senderStats.map(s => {
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

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sender stats' });
    }
});

// Get automated insights/alerts
router.get('/insights', async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            where: { status: 'open' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const insights = alerts.map(alert => ({
            id: alert.id,
            type: alert.severity === 'critical' || alert.severity === 'high' ? 'warning' : 'info',
            title: alert.alertType.charAt(0) + alert.alertType.slice(1).toLowerCase().replace('_', ' '),
            description: alert.summary,
            icon: alert.alertType === 'THROTTLING' ? 'mdi:clock-alert' : 'mdi:alert-decagram',
            createdAt: alert.createdAt
        }));

        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

// Get incidents and timeline
router.get('/incidents', async (req, res) => {
    try {
        const incidents = await prisma.incident.findMany({
            include: { alerts: true },
            orderBy: { startTime: 'desc' },
            take: 20
        });
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

module.exports = router;
