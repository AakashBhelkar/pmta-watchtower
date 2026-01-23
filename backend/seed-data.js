const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { DateTime } = require('luxon');

async function seed() {
    console.log('🌱 Starting performance seed...');

    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com'];
    const senders = ['marketing@acme.com', 'alerts@notify.io', 'promo@deals.com', 'news@updates.co', 'billing@service.com'];
    const vmtas = ['vmta-1', 'vmta-2', 'vmta-3', 'vmta-4', 'vmta-5'];
    const statusCodes = ['250', '421', '451', '452', '550', '554'];

    // 1. Create a dummy file record
    const file = await prisma.file.create({
        data: {
            fileName: 'seed_load_test.csv',
            fileType: 'acct',
            fileSize: BigInt(1024 * 1024 * 50),
            processingStatus: 'completed',
            rowCount: 10000,
        }
    });

    const BATCH_SIZE = 1000;
    const TOTAL_ROWS = 10000;
    const DAYS_BACK = 7;

    console.log(`🚀 Generating ${TOTAL_ROWS} rows over ${DAYS_BACK} days...`);

    for (let i = 0; i < TOTAL_ROWS; i += BATCH_SIZE) {
        const events = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            const timestamp = DateTime.now()
                .minus({ days: Math.random() * DAYS_BACK })
                .minus({ minutes: Math.random() * 1440 })
                .toJSDate();

            const domain = domains[Math.floor(Math.random() * domains.length)];
            const type = Math.random() > 0.2 ? 'tran' : (Math.random() > 0.5 ? 'bounce' : 'fbl');
            const sender = senders[Math.floor(Math.random() * senders.length)];
            const status = (type === 'tran' || type === 'acct') ? '250' : statusCodes[Math.floor(Math.random() * statusCodes.length)];

            events.push({
                eventType: type,
                eventTimestamp: timestamp,
                fileId: file.id,
                jobId: `JOB-${1000 + Math.floor(Math.random() * 100)}`,
                sender: sender,
                recipient: `user${i + j}@${domain}`,
                recipientDomain: domain,
                vmta: vmtas[Math.floor(Math.random() * vmtas.length)],
                smtpStatus: status,
                bounceCategory: type === 'bounce' ? (Math.random() > 0.5 ? 'hard' : 'soft') : null,
                deliveryLatency: (type === 'acct' || type === 'tran') ? (Math.random() * 5) : null,
                dsnAction: (type === 'acct' || type === 'tran') ? 'delivered' : 'failed',
            });
        }

        await prisma.event.createMany({
            data: events,
            skipDuplicates: true
        });

        process.stdout.write(`\rProgress: ${i + BATCH_SIZE}/${TOTAL_ROWS} rows inserted...`);
    }

    console.log('\n✅ Seeding complete!');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
