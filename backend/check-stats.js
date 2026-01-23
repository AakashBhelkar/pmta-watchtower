const prisma = require('./lib/prisma');

async function main() {
    const eventCounts = await prisma.event.groupBy({
        by: ['eventType'],
        _count: true
    });
    console.log('Event Counts:', JSON.stringify(eventCounts, null, 2));

    const aggStats = await prisma.aggregateMinute.aggregate({
        _sum: {
            totalCount: true,
            delivered: true,
            bounced: true,
            deferred: true,
            complaints: true
        },
        _max: {
            avgLatencyMs: true,
            deferred: true
        }
    });
    console.log('Aggregated Stats:', JSON.stringify(aggStats, null, 2));

    const highLatencyRecs = await prisma.aggregateMinute.findMany({
        where: { avgLatencyMs: { gt: 0 } },
        orderBy: { avgLatencyMs: 'desc' },
        take: 5
    });
    console.log('Highest Latency Records:', JSON.stringify(highLatencyRecs, null, 2));

    const statsByEventType = await prisma.aggregateMinute.groupBy({
        by: ['eventType'],
        _sum: {
            totalCount: true,
            delivered: true,
            bounced: true,
            deferred: true,
            complaints: true
        }
    });
    console.log('Stats by EventType in AggregateMinute:', JSON.stringify(statsByEventType, null, 2));

    await prisma.$disconnect();
}

main().catch(console.error);
