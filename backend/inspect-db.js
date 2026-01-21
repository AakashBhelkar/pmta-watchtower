const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const files = await prisma.file.findMany({
        select: { id: true, fileName: true, fileType: true }
    });
    console.log('Files:', JSON.stringify(files, null, 2));

    const eventsByFile = await prisma.event.groupBy({
        by: ['fileId'],
        _count: true
    });
    console.log('Events by File:', JSON.stringify(eventsByFile, null, 2));

    const eventCounts = await prisma.event.groupBy({
        by: ['eventType'],
        _count: true
    });
    console.log('Event Types:', JSON.stringify(eventCounts, null, 2));

    const sampleEvent = await prisma.event.findFirst({
        where: { fileId: { not: null } }
    });
    console.log('Sample Event with FileId:', JSON.stringify(sampleEvent, null, 2));

    const alerts = await prisma.alert.count();
    const incidents = await prisma.incident.count();
    console.log(`\nAlerts: ${alerts}, Incidents: ${incidents}`);

    const aggCount = await prisma.aggregateMinute.count();
    console.log('Aggregate Count:', aggCount);

    await prisma.$disconnect();
}

main().catch(console.error);
