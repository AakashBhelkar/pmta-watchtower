const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { detectFileType } = require('./utils/csvParser');
const analyticsService = require('./services/analyticsService');

async function fixDataAndReAggregate() {
    console.log('🚀 Starting Data Fix & Re-aggregation...');

    // 0. Clear logic
    console.log('🧹 Clearing AggregateMinute and RiskScore tables...');
    await prisma.aggregateMinute.deleteMany();
    await prisma.riskScore.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.incident.deleteMany();

    // 1. Get all files
    const files = await prisma.file.findMany();

    for (const file of files) {
        console.log(`\nProcessing file: ${file.fileName} (${file.id})`);

        // Fetch first few events to get headers from rawData
        const sampleEvent = await prisma.event.findFirst({
            where: { fileId: file.id },
            select: { rawData: true }
        });

        if (!sampleEvent || !sampleEvent.rawData) {
            console.log(`Skipping ${file.fileName}: No events found.`);
            continue;
        }

        const headers = Object.keys(sampleEvent.rawData);
        const correctType = detectFileType(headers);
        console.log(`Detected Correct Type: ${correctType} (Was: ${file.fileType})`);

        // Update File type
        await prisma.file.update({
            where: { id: file.id },
            data: { fileType: correctType }
        });

        // Update all Events for this file with type mapping
        console.log(`Updating events for ${file.fileName}...`);

        // We can do this with a few raw queries for speed
        if (correctType === 'acct') {
            await prisma.$executeRawUnsafe(`
                UPDATE "Event" SET "eventType" = 'tran' WHERE "fileId" = '${file.id}' AND ("rawData"->>'type' = 'd' OR "rawData"->>'type' = 'D')
            `);
            await prisma.$executeRawUnsafe(`
                UPDATE "Event" SET "eventType" = 'bounce' WHERE "fileId" = '${file.id}' AND ("rawData"->>'type' = 'b' OR "rawData"->>'type' = 'B')
            `);
            await prisma.$executeRawUnsafe(`
                UPDATE "Event" SET "eventType" = 'fbl' WHERE "fileId" = '${file.id}' AND ("rawData"->>'type' = 'f' OR "rawData"->>'type' = 'F')
            `);
            await prisma.$executeRawUnsafe(`
                UPDATE "Event" SET "eventType" = 'rb' WHERE "fileId" = '${file.id}' AND ("rawData"->>'type' = 'r' OR "rawData"->>'type' = 'R')
            `);
            // Rest stay as 'acct' (the default transient/deferred)
        } else {
            await prisma.event.updateMany({
                where: { fileId: file.id },
                data: { eventType: correctType }
            });
        }

        // 2. Clear old aggregations (just in case)
        // Note: AggregateMinute is shared, so we'd normally filter by file attributes if possible, 
        // but here it's cleaner to reset it if we're redoing everything.
        // For now, let's just trigger the new aggregation which handles upserts.

        console.log(`Triggering aggregation for ${file.fileName}...`);
        await analyticsService.aggregateFileData(file.id);
    }

    // 3. Historical Incident Detection Sweep
    console.log('\n🕵️ Running historical incident detection sweep...');
    const lastAgg = await prisma.aggregateMinute.findFirst({
        orderBy: { timeBucket: 'desc' }
    });

    if (lastAgg) {
        const endTime = lastAgg.timeBucket;
        // Run detection every 15 mins for the last 5 hours of data
        for (let i = 0; i < 20; i++) {
            const refDate = new Date(endTime.getTime() - i * 15 * 60 * 1000);
            await require('./services/incidentDetector').detectIncidents(refDate);
        }
    }

    // 4. One final check on counts
    const aggCount = await prisma.aggregateMinute.count();
    const alertCount = await prisma.alert.count();
    console.log(`\nFinal AggregateMinute Count: ${aggCount}`);
    console.log(`Final Alert Count: ${alertCount}`);

    await prisma.$disconnect();
    console.log('\n✅ Data Fix and Re-aggregation Complete.');
}

fixDataAndReAggregate().catch(err => {
    console.error('❌ Data Fix Error:', err);
    process.exit(1);
});
