const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Runs incident detection rules against recent data
 * @param {Date} referenceDate Optional date to use as 'now'
 */
exports.detectIncidents = async (referenceDate = new Date()) => {
    try {
        console.log(`🔍 Running Incident Detection Rules (Reference: ${referenceDate.toISOString()})...`);

        const now = referenceDate;
        const shortWindow = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins
        const longWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

        // Rule 1: Domain Throttling
        await this.detectDomainThrottling(shortWindow, longWindow);

        // Rule 2: Complaint Spikes
        await this.detectComplaintSpikes(new Date(now.getTime() - 30 * 60 * 1000), new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

        // Rule 3: High Bounce Rate
        await this.detectHighBounceRate(shortWindow);

        console.log('✅ Incident Detection Complete.');
    } catch (error) {
        console.error('❌ Incident Detection Error:', error);
    }
};

/**
 * Detects domain-level throttling based on latency deviation
 */
exports.detectDomainThrottling = async (shortWindow, longWindow) => {
    // Current Latency per domain (15m)
    const currentLatency = await prisma.aggregateMinute.groupBy({
        by: ['recipientDomain'],
        _avg: { avgLatencyMs: true },
        _sum: { totalCount: true, deferred: true },
        where: { timeBucket: { gte: shortWindow }, eventType: 'tran' }
    });

    for (const domain of currentLatency) {
        if (!domain._avg.avgLatencyMs) continue;

        // Baseline (24h)
        const baseline = await prisma.aggregateMinute.aggregate({
            _avg: { avgLatencyMs: true },
            where: {
                recipientDomain: domain.recipientDomain,
                timeBucket: { gte: longWindow },
                eventType: 'tran'
            }
        });

        const baselineAvg = baseline._avg.avgLatencyMs || 500; // fallback 500ms

        if (domain._avg.avgLatencyMs > baselineAvg * 1.5 && (domain._sum.deferred > 0 || domain._avg.avgLatencyMs > 5000)) {
            await this.createAlert({
                alertType: 'THROTTLING',
                severity: 'high',
                entityType: 'domain',
                entityValue: domain.recipientDomain,
                summary: `ISP Throttling detected on ${domain.recipientDomain}: Latency is ${(domain._avg.avgLatencyMs / 1000).toFixed(1)}s`,
                metrics: { currentLatency: domain._avg.avgLatencyMs, baselineLatency: baselineAvg, deferred: domain._sum.deferred }
            });
        }
    }
};

/**
 * Detects unusual spikes in complaints
 */
exports.detectComplaintSpikes = async (shortWindow, longWindow) => {
    const currentComplaints = await prisma.aggregateMinute.groupBy({
        by: ['jobId'],
        _sum: { complaints: true, totalCount: true },
        where: { timeBucket: { gte: shortWindow } }
    });

    for (const job of currentComplaints) {
        if (!job._sum.complaints || job._sum.complaints < 1) continue;

        const rate = job._sum.complaints / job._sum.totalCount;

        if (rate > 0.01) { // 1% complaint rate
            await this.createAlert({
                alertType: 'COMPLAINT_SPIKE',
                severity: 'critical',
                entityType: 'job',
                entityValue: job.jobId || 'unknown',
                summary: `Complaint spike for Job ${job.jobId}: Rate is ${(rate * 100).toFixed(2)}%`,
                metrics: { complaintRate: rate, totalComplaints: job._sum.complaints }
            });
        }
    }
};

/**
 * Detects high bounce rates
 */
exports.detectHighBounceRate = async (shortWindow) => {
    const stats = await prisma.aggregateMinute.groupBy({
        by: ['jobId'],
        _sum: { bounced: true, totalCount: true },
        where: { timeBucket: { gte: shortWindow } }
    });

    for (const job of stats) {
        if (!job._sum.bounced || job._sum.totalCount < 10) continue;

        const rate = job._sum.bounced / job._sum.totalCount;

        if (rate > 0.2) { // 20% bounce rate
            await this.createAlert({
                alertType: 'HIGH_BOUNCE',
                severity: 'high',
                entityType: 'job',
                entityValue: job.jobId || 'unknown',
                summary: `High bounce rate for Job ${job.jobId}: ${(rate * 100).toFixed(1)}%`,
                metrics: { bounceRate: rate, totalBounced: job._sum.bounced }
            });
        }
    }
};

/**
 * Logic to save alert and prevent duplicates, and manage incidents
 */
exports.createAlert = async (data) => {
    const existing = await prisma.alert.findFirst({
        where: {
            alertType: data.alertType,
            entityValue: data.entityValue,
            status: 'open',
            createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } // Cooldown 30 mins
        }
    });

    if (existing) return;

    // Find or Create Incident
    let incident = await prisma.incident.findFirst({
        where: {
            entityType: data.entityType,
            entityValue: data.entityValue,
            status: 'open'
        }
    });

    if (!incident) {
        incident = await prisma.incident.create({
            data: {
                title: `${data.alertType.replace('_', ' ')}: ${data.entityValue}`,
                severity: data.severity,
                entityType: data.entityType,
                entityValue: data.entityValue,
                startTime: new Date(),
                summary: data.summary,
                status: 'open'
            }
        });
    }

    await prisma.alert.create({
        data: {
            ...data,
            incidentId: incident.id,
            timeWindowStart: new Date(Date.now() - 15 * 60 * 1000),
            timeWindowEnd: new Date()
        }
    });

    console.log(`🚨 ALERT GENERATED: ${data.summary}`);
};
