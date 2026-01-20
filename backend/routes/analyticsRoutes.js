const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Parser } = require('json2csv');

// Export aggregated reports
router.get('/export', async (req, res) => {
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
router.get('/stats', async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = {
            timeBucket: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            }
        };

        const aggregation = await prisma.aggregateMinute.aggregate({
            _sum: {
                totalCount: true,
                delivered: true,
                bounced: true,
                deferred: true,
                complaints: true
            },
            where
        });

        const rbCounts = await prisma.aggregateMinute.aggregate({
            _sum: { totalCount: true },
            where: { ...where, eventType: 'rb' }
        });

        const stats = {
            sent: aggregation._sum.totalCount || 0,
            delivered: aggregation._sum.delivered || 0,
            bounced: aggregation._sum.bounced || 0,
            deferred: aggregation._sum.deferred || 0,
            complaints: aggregation._sum.complaints || 0,
            rbEvents: rbCounts._sum.totalCount || 0
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get volume trends (grouped by hour)
router.get('/volume', async (req, res) => {
    try {
        const { from, to } = req.query;
        const volumeTrend = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('hour', "timeBucket") as "time",
                SUM("totalCount") as "sent",
                SUM("delivered") as "delivered",
                SUM("bounced") as "bounced",
                SUM("deferred") as "deferred"
            FROM "AggregateMinute"
            WHERE "timeBucket" >= ${from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
              AND "timeBucket" <= ${to ? new Date(to) : new Date()}
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        res.json(volumeTrend);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch volume data' });
    }
});

// Get latency trends (grouped by hour)
router.get('/latency', async (req, res) => {
    try {
        const { from, to } = req.query;
        const latencyTrend = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('hour', "timeBucket") as "time",
                AVG("avgLatencyMs") / 1000 as "avgLatency",
                MAX("p95LatencyMs") / 1000 as "p95Latency",
                SUM("totalCount") as "count"
            FROM "AggregateMinute"
            WHERE "eventType" = 'tran'
              AND "timeBucket" >= ${from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
              AND "timeBucket" <= ${to ? new Date(to) : new Date()}
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        res.json(latencyTrend);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch latency data' });
    }
});

// Get domain performance
router.get('/domains', async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = {
            timeBucket: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            },
            recipientDomain: { not: null }
        };

        const domainStats = await prisma.aggregateMinute.groupBy({
            by: ['recipientDomain'],
            _sum: { totalCount: true, delivered: true, bounced: true, complaints: true },
            _avg: { avgLatencyMs: true },
            where,
            orderBy: { _sum: { totalCount: 'desc' } },
            take: 100
        });

        const stats = domainStats.map(d => ({
            domain: d.recipientDomain,
            total: d._sum.totalCount,
            delivered: d._sum.delivered,
            bounced: d._sum.bounced,
            complaints: d._sum.complaints,
            avgLatency: d._avg.avgLatencyMs ? (d._avg.avgLatencyMs / 1000).toFixed(2) : 0
        }));

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch domain stats' });
    }
});

// Get sender performance and risk
router.get('/senders', async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = {
            timeBucket: {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            },
            sender: { not: null }
        };

        const senderStats = await prisma.aggregateMinute.groupBy({
            by: ['sender'],
            _sum: { totalCount: true, delivered: true, bounced: true, complaints: true },
            where,
            orderBy: { _sum: { totalCount: 'desc' } },
            take: 100
        });

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
                total: s._sum.totalCount,
                delivered: s._sum.delivered,
                bounced: s._sum.bounced,
                complaints: s._sum.complaints,
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
