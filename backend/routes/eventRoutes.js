const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { validate, schemas } = require('../middleware/validate');

// Query events with filters
router.get('/', validate(schemas.eventQuery), async (req, res) => {
    try {
        const {
            type,
            jobId,
            sender,
            domain,
            page = 0,
            limit = 50
        } = req.query;

        const where = {
            eventType: type || undefined,
            jobId: jobId ? { contains: jobId, mode: 'insensitive' } : undefined,
            sender: sender ? { contains: sender, mode: 'insensitive' } : undefined,
            recipientDomain: domain ? { contains: domain, mode: 'insensitive' } : undefined,
        };

        const [events, total] = await prisma.$transaction([
            prisma.event.findMany({
                where,
                orderBy: { eventTimestamp: 'desc' },
                skip: parseInt(page) * parseInt(limit),
                take: parseInt(limit),
                include: { file: { select: { fileName: true } } }
            }),
            prisma.event.count({ where })
        ]);

        res.json({
            data: events,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Event Query Error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get correlated events for a message journey (multi-key correlator)
router.get('/related/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { jobId, recipient, customHeader, from, to } = req.query;

        const timeFilter = {};
        if (from || to) {
            timeFilter.eventTimestamp = {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            };
        }

        const baseInclude = { file: { select: { fileName: true } } };

        const findEvents = async (whereExtra) => {
            return prisma.event.findMany({
                where: { ...timeFilter, ...whereExtra },
                orderBy: { eventTimestamp: 'asc' },
                include: baseInclude,
            });
        };

        // 1) Try by messageId if provided and not literal 'null'
        if (messageId && messageId !== 'null') {
            const events = await findEvents({ messageId });
            if (events.length > 0) {
                return res.json({
                    correlationMethod: 'messageId',
                    correlationKey: messageId,
                    events,
                });
            }
        }

        // 2) Fallback: jobId + recipient
        if (jobId && recipient) {
            const events = await findEvents({ jobId, recipient });
            if (events.length > 0) {
                return res.json({
                    correlationMethod: 'jobId+recipient',
                    correlationKey: `${jobId} / ${recipient}`,
                    events,
                });
            }
        }

        // 3) Fallback: customHeader + recipient
        if (customHeader && recipient) {
            const events = await findEvents({ customHeader, recipient });
            if (events.length > 0) {
                return res.json({
                    correlationMethod: 'customHeader+recipient',
                    correlationKey: `${customHeader} / ${recipient}`,
                    events,
                });
            }
        }

        // Nothing found with any key
        return res.json({
            correlationMethod: 'none',
            correlationKey: null,
            events: [],
        });
    } catch (error) {
        console.error('Related Events Error:', error);
        res.status(500).json({ error: 'Failed to fetch correlated events' });
    }
});

module.exports = router;
