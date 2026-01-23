const prisma = require('../lib/prisma');
const config = require('../config');

/**
 * Runs incident detection rules against recent data
 * @param {Date} referenceDate Optional date to use as 'now'
 */
exports.detectIncidents = async (referenceDate = new Date()) => {
    try {
        console.log(`🔍 Running Incident Detection Rules (Reference: ${referenceDate.toISOString()})...`);

        const now = referenceDate;
        const shortWindow = new Date(now.getTime() - config.detection.shortWindowMs);
        const longWindow = new Date(now.getTime() - config.detection.longWindowMs);

        // Rule 1: Domain Throttling
        await this.detectDomainThrottling(shortWindow, longWindow);

        // Rule 2: Complaint Spikes
        await this.detectComplaintSpikes(
            new Date(now.getTime() - config.detection.complaintWindowMs),
            new Date(now.getTime() - config.detection.weeklyWindowMs)
        );

        // Rule 3: High Bounce Rate
        await this.detectHighBounceRate(shortWindow);

        console.log('✅ Incident Detection Complete.');
    } catch (error) {
        console.error('❌ Incident Detection Error:', error);
    }
};

/**
 * Detects domain-level throttling based on latency deviation
 * Uses sum/count pattern for correct latency calculation
 */
exports.detectDomainThrottling = async (shortWindow, longWindow) => {
    // Query 1: Get current latency per domain using sum/count for correct averaging
    const currentLatency = await prisma.aggregateMinute.groupBy({
        by: ['recipientDomain'],
        _sum: { latencySumMs: true, latencyCount: true, deferred: true, deliveredMessages: true },
        where: { timeBucket: { gte: shortWindow }, eventType: 'tran' }
    });

    // Extract domain list for batch baseline query
    const domains = currentLatency
        .filter(d => d.recipientDomain && d._sum.latencyCount > 0)
        .map(d => d.recipientDomain);

    if (domains.length === 0) return;

    // Query 2: Get baselines for ALL domains in a single query
    const baselines = await prisma.aggregateMinute.groupBy({
        by: ['recipientDomain'],
        _sum: { latencySumMs: true, latencyCount: true },
        where: {
            recipientDomain: { in: domains },
            timeBucket: { gte: longWindow },
            eventType: 'tran'
        }
    });

    // Create lookup map with computed averages for O(1) access
    const baselineMap = new Map(
        baselines.map(b => {
            const avgMs = b._sum.latencyCount > 0 ? b._sum.latencySumMs / b._sum.latencyCount : 0;
            return [b.recipientDomain, avgMs];
        })
    );

    // Process domains with O(1) lookups
    for (const domain of currentLatency) {
        if (!domain._sum.latencyCount || domain._sum.latencyCount === 0) continue;

        const currentAvgMs = domain._sum.latencySumMs / domain._sum.latencyCount;
        const baselineAvg = baselineMap.get(domain.recipientDomain) || config.thresholds.baselineLatencyMs;

        if (currentAvgMs > baselineAvg * config.thresholds.throttlingMultiplier &&
            (domain._sum.deferred > 0 || currentAvgMs > config.thresholds.highLatencyMs)) {
            await this.createAlert({
                alertType: 'THROTTLING',
                severity: 'high',
                entityType: 'domain',
                entityValue: domain.recipientDomain,
                summary: `ISP Throttling detected on ${domain.recipientDomain}: Latency is ${(currentAvgMs / 1000).toFixed(1)}s`,
                metrics: { currentLatency: currentAvgMs, baselineLatency: baselineAvg, deferred: domain._sum.deferred }
            });
        }
    }
};

/**
 * Detects unusual spikes in complaints using message-based metrics
 */
exports.detectComplaintSpikes = async (shortWindow, longWindow) => {
    // Use message-based counts for accurate rate calculation
    const currentComplaints = await prisma.aggregateMinute.groupBy({
        by: ['jobId'],
        _sum: { complaintMessages: true, messageAttempts: true },
        where: { timeBucket: { gte: shortWindow } }
    });

    for (const job of currentComplaints) {
        if (!job._sum.complaintMessages || job._sum.complaintMessages < 1) continue;
        if (!job._sum.messageAttempts || job._sum.messageAttempts === 0) continue;

        const rate = job._sum.complaintMessages / job._sum.messageAttempts;

        if (rate > config.thresholds.complaintRate) {
            await this.createAlert({
                alertType: 'COMPLAINT_SPIKE',
                severity: 'critical',
                entityType: 'job',
                entityValue: job.jobId || 'unknown',
                summary: `Complaint spike for Job ${job.jobId}: Rate is ${(rate * 100).toFixed(2)}%`,
                metrics: { complaintRate: rate, totalComplaints: job._sum.complaintMessages }
            });
        }
    }
};

/**
 * Detects high bounce rates using message-based metrics
 */
exports.detectHighBounceRate = async (shortWindow) => {
    // Use message-based counts for accurate rate calculation
    const stats = await prisma.aggregateMinute.groupBy({
        by: ['jobId'],
        _sum: { bouncedMessages: true, messageAttempts: true },
        where: { timeBucket: { gte: shortWindow } }
    });

    for (const job of stats) {
        if (!job._sum.bouncedMessages || !job._sum.messageAttempts) continue;
        if (job._sum.messageAttempts < config.thresholds.minMessagesForBounce) continue;

        const rate = job._sum.bouncedMessages / job._sum.messageAttempts;

        if (rate > config.thresholds.bounceRate) {
            await this.createAlert({
                alertType: 'HIGH_BOUNCE',
                severity: 'high',
                entityType: 'job',
                entityValue: job.jobId || 'unknown',
                summary: `High bounce rate for Job ${job.jobId}: ${(rate * 100).toFixed(1)}%`,
                metrics: { bounceRate: rate, totalBounced: job._sum.bouncedMessages }
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
            createdAt: { gte: new Date(Date.now() - config.detection.alertCooldownMs) }
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
            timeWindowStart: new Date(Date.now() - config.detection.shortWindowMs),
            timeWindowEnd: new Date()
        }
    });

    console.log(`🚨 ALERT GENERATED: ${data.summary}`);
};
