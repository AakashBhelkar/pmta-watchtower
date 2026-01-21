// PMTA Header mappings
const FILE_TYPE_HEADERS = {
    acct: ['type', 'timeLogged', 'timeQueued', 'orig', 'rcpt', 'dsnAction', 'dsnStatus', 'dsnDiag', 'bounceCat', 'vmta', 'jobId'],
    tran: ['type', 'timeLogged', 'timeQueued', 'orig', 'rcpt', 'dsnStatus', 'dsnDiag', 'vmta', 'jobId'],
    bounce: ['type', 'timeLogged', 'bounceCat', 'vmta', 'orig', 'rcpt', 'dsnStatus', 'dsnDiag', 'jobId'],
    fbl: ['type', 'timeLogged', 'orig', 'rcpt', 'vmta', 'jobId'],
    rb: ['type', 'timeLogged', 'vmta', 'domain', 'rbType', 'dsnStatus', 'dsnDiag'],
};

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

        if (ratio >= 0.6 && ratio > highestRatio) {
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
        switch (row.type.toLowerCase()) {
            case 'd': mappedType = 'tran'; break; // Delivered
            case 'b': mappedType = 'bounce'; break; // Bounce
            case 't': mappedType = 'acct'; break; // Transient/Deferred (keep as acct)
            case 'f': mappedType = 'fbl'; break; // Feedback Loop
            case 'r': mappedType = 'rb'; break; // Remote Bounce
            // Other types like 'p' (queued) can stay as 'acct' or be excluded
        }
    }

    return {
        eventType: mappedType,
        eventTimestamp: parseTimestamp(row.timeLogged),
        fileId: fileId,
        jobId: row.jobId || null,
        sender: row.orig || null,
        recipient: row.rcpt || null,
        recipientDomain: row.domain || extractDomain(row.rcpt),
        vmta: row.vmta || null,
        vmtaPool: row.vmtaPool || row.vmtaPool2 || null,
        sourceIp: row.dlvSourceIp || null,
        destinationIp: row.dlvDestinationIp || null,
        envId: row.envId || null,
        messageId: row.messageId || null,

        smtpStatus: row.dsnStatus || null,
        bounceCategory: row.bounceCat || null,
        dsnAction: row.dsnAction || null,
        dsnDiag: row.dsnDiag || null,

        deliveryLatency: calculateLatency(row.timeLogged, row.timeQueued),
        rawData: row
    };
};
