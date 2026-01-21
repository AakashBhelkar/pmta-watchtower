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

// Get correlated events for a messageId
router.get('/related/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;

        if (!messageId || messageId === 'null') {
            return res.status(400).json({ error: 'Message ID is required' });
        }

        const events = await prisma.event.findMany({
            where: { messageId },
            orderBy: { eventTimestamp: 'asc' },
            include: { file: { select: { fileName: true } } }
        });

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch correlated events' });
    }
});

module.exports = router;
