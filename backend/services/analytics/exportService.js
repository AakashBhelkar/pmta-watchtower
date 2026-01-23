/**
 * CSV export service
 */
const prisma = require('../../lib/prisma');
const { Parser } = require('json2csv');

/**
 * Generate CSV export for analytics data
 */
async function generateExport(from, to, type = 'domain') {
    const where = {
        timeBucket: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
        }
    };

    let data = [];
    let fields = [];

    if (type === 'domain') {
        // Use message-based counts for accurate deduplication
        const domainStats = await prisma.aggregateMinute.groupBy({
            by: ['recipientDomain'],
            _sum: {
                messageAttempts: true,
                deliveredMessages: true,
                bouncedMessages: true,
                complaintMessages: true,
                latencySumMs: true,
                latencyCount: true
            },
            where
        });

        data = domainStats.map(d => {
            const latencySum = d._sum.latencySumMs || 0;
            const latencyCount = d._sum.latencyCount || 0;
            const avgLatencyMs = latencyCount > 0 ? latencySum / latencyCount : 0;
            return {
                Domain: d.recipientDomain,
                'Message Attempts': d._sum.messageAttempts || 0,
                Delivered: d._sum.deliveredMessages || 0,
                Bounced: d._sum.bouncedMessages || 0,
                Complaints: d._sum.complaintMessages || 0,
                'Avg Latency (s)': (avgLatencyMs / 1000).toFixed(2)
            };
        });
        fields = ['Domain', 'Message Attempts', 'Delivered', 'Bounced', 'Complaints', 'Avg Latency (s)'];
    } else if (type === 'sender') {
        // Use message-based counts for accurate deduplication
        const senderStats = await prisma.aggregateMinute.groupBy({
            by: ['sender'],
            _sum: {
                messageAttempts: true,
                deliveredMessages: true,
                bouncedMessages: true,
                complaintMessages: true
            },
            where
        });

        data = senderStats.map(s => ({
            Sender: s.sender,
            'Message Attempts': s._sum.messageAttempts || 0,
            Delivered: s._sum.deliveredMessages || 0,
            Bounced: s._sum.bouncedMessages || 0,
            Complaints: s._sum.complaintMessages || 0
        }));
        fields = ['Sender', 'Message Attempts', 'Delivered', 'Bounced', 'Complaints'];
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    return {
        csv,
        filename: `pmta_report_${type}_${Date.now()}.csv`
    };
}

module.exports = {
    generateExport
};
