const { FILE_TYPE_HEADERS, ACCT_TYPE_MAPPINGS } = require('../constants/eventTypes');
const config = require('../config');

exports.detectFileType = (headers) => {
    if (!headers || !Array.isArray(headers)) return 'unknown';

    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    let bestMatch = 'unknown';
    let highestRatio = 0;

    for (const [fileType, expectedHeaders] of Object.entries(FILE_TYPE_HEADERS)) {
        const matchCount = expectedHeaders.filter(h =>
            normalizedHeaders.includes(h.toLowerCase())
        ).length;

        const ratio = matchCount / expectedHeaders.length;

        if (ratio >= config.csvParser.fileTypeMatchThreshold && ratio > highestRatio) {
            highestRatio = ratio;
            bestMatch = fileType;
        }
    }
    return bestMatch;
};

exports.normalizeEvent = (row, fileType, fileId) => {
    if (!row || !fileType) return null;

    const extractDomain = (email) => {
        if (!email) return null;
        const parts = email.split('@');
        return parts.length > 1 ? parts[1].toLowerCase() : null;
    };

    const parseTimestamp = (ts) => {
        if (!ts) return null;
        const date = new Date(ts);
        return isNaN(date.getTime()) ? null : date;
    };

    const calculateLatency = (logged, queued) => {
        if (!logged || !queued) return null;
        const l = new Date(logged);
        const q = new Date(queued);
        if (isNaN(l) || isNaN(q)) return null;
        return (l - q) / 1000; // in seconds
    };

    // Determine specific event type for 'acct' logs based on 'type' field
    let mappedType = fileType;
    if (fileType === 'acct' && row.type) {
        const typeCode = row.type.toLowerCase();
        mappedType = ACCT_TYPE_MAPPINGS[typeCode] || 'acct';
    }

    // Compute messageKey for deduplication: prefer messageId, fallback to jobId:recipient
    const jobId = row.jobId || null;
    const recipient = row.rcpt || null;
    const messageId = row.messageId || null;
    const messageKey = messageId || (jobId && recipient ? `${jobId}:${recipient}` : null);

    return {
        eventType: mappedType,
        eventTimestamp: parseTimestamp(row.timeLogged),
        fileId: fileId,
        jobId: jobId,
        sender: row.orig || null,
        recipient: recipient,
        recipientDomain: row.domain || extractDomain(row.rcpt),
        vmta: row.vmta || null,
        vmtaPool: row.vmtaPool || row.vmtaPool2 || null,
        sourceIp: row.dlvSourceIp || null,
        destinationIp: row.dlvDestinationIp || null,
        envId: row.envId || null,
        messageId: messageId,
        messageKey: messageKey,

        smtpStatus: row.dsnStatus || null,
        bounceCategory: row.bounceCat || null,
        dsnAction: row.dsnAction || null,
        dsnDiag: row.dsnDiag || null,

        deliveryLatency: calculateLatency(row.timeLogged, row.timeQueued),
        rawData: row
    };
};
