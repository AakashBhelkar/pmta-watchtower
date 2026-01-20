import Papa from 'papaparse';

// ----------------------------------------------------------------------
// PMTA CSV File Type Detection
// ----------------------------------------------------------------------

/**
 * Known headers for each PMTA file type
 */
const FILE_TYPE_HEADERS = {
    acct: ['type', 'timeLogged', 'timeQueued', 'orig', 'rcpt', 'orcpt', 'dsnAction', 'dsnStatus', 'dsnDiag', 'dsnMta', 'bounceCat', 'srcType', 'srcMta', 'dlvType', 'dlvSourceIp', 'dlvDestinationIp', 'dlvEsmtpAvailable', 'dlvSize', 'vmta', 'vmtaPool', 'jobId', 'envId', 'queue', 'vmtaPool2'],
    tran: ['type', 'timeLogged', 'timeQueued', 'orig', 'rcpt', 'orcpt', 'dsnAction', 'dsnStatus', 'dsnDiag', 'dsnMta', 'bounceCat', 'retries', 'srcType', 'srcMta', 'dlvType', 'dlvSourceIp', 'dlvDestinationIp', 'dlvEsmtpAvailable', 'dlvSize', 'vmta', 'vmtaPool', 'jobId', 'envId'],
    bounce: ['type', 'timeLogged', 'bounceCat', 'vmta', 'orig', 'rcpt', 'srcMta', 'dsnStatus', 'dsnMta', 'dsnDiag', 'jobId', 'envId'],
    fbl: ['type', 'timeLogged', 'orig', 'rcpt', 'srcMta', 'dlvSourceIp', 'reportingMta', 'vmta', 'vmtaPool', 'jobId', 'envId', 'queue'],
    rb: ['type', 'timeLogged', 'vmta', 'vmtaPool', 'domain', 'rbType', 'rbLimit', 'rbValue', 'rbDuration', 'dsnStatus', 'dsnDiag'],
};

/**
 * Detect file type based on headers
 */
export const detectFileType = (headers) => {
    if (!headers || !Array.isArray(headers)) return null;

    const normalizedHeaders = headers.map(h => h?.toLowerCase().trim());

    const detected = Object.entries(FILE_TYPE_HEADERS).find(([fileType, expectedHeaders]) => {
        // Check if at least 60% of expected headers are present
        const matchCount = expectedHeaders.filter(h =>
            normalizedHeaders.includes(h.toLowerCase())
        ).length;

        const matchRatio = matchCount / expectedHeaders.length;
        return matchRatio >= 0.6;
    });

    return detected ? detected[0] : null;
};

/**
 * Validate file headers for a given type
 */
export const validateFileHeaders = (headers, expectedType) => {
    const expectedHeaders = FILE_TYPE_HEADERS[expectedType];
    if (!expectedHeaders) {
        return { valid: false, errors: ['Unknown file type'] };
    }

    const normalizedHeaders = headers.map(h => h?.toLowerCase().trim());
    const missingHeaders = expectedHeaders.filter(h =>
        !normalizedHeaders.includes(h.toLowerCase())
    );

    const extraHeaders = normalizedHeaders.filter(h =>
        !expectedHeaders.map(eh => eh.toLowerCase()).includes(h)
    );

    return {
        valid: missingHeaders.length === 0,
        missingHeaders,
        extraHeaders,
        errors: missingHeaders.length > 0 ? [`Missing required headers: ${missingHeaders.join(', ')}`] : [],
    };
};

// ----------------------------------------------------------------------
// CSV Parsing
// ----------------------------------------------------------------------

/**
 * Parse CSV file with streaming for large files
 */
export const parseCSVFile = (file, options = {}) =>
    new Promise((resolve, reject) => {
        const results = [];
        let headers = null;
        let rowCount = 0;
        const errors = [];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            worker: true, // Use web worker for large files
            chunk: (chunk, parser) => {
                if (!headers && chunk.meta.fields) {
                    headers = chunk.meta.fields;
                }

                results.push(...chunk.data);
                rowCount += chunk.data.length;

                // Call progress callback if provided
                if (options.onProgress) {
                    options.onProgress({
                        rowCount,
                        bytesProcessed: chunk.meta.cursor,
                    });
                }

                // Check chunk size limit if provided
                if (options.chunkLimit && rowCount >= options.chunkLimit) {
                    parser.abort();
                }
            },
            error: (error) => {
                errors.push(error.message);
                if (options.onError) {
                    options.onError(error);
                }
            },
            complete: () => {
                resolve({
                    data: results,
                    headers,
                    rowCount,
                    errors,
                });
            },
        });
    });

/**
 * Parse CSV file in chunks with callback
 */
export const parseCSVFileChunked = (file, chunkCallback, options = {}) =>
    new Promise((resolve, reject) => {
        let headers = null;
        let totalRows = 0;
        const chunkSize = options.chunkSize || 1000;
        let currentChunk = [];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: (row, parser) => {
                if (!headers) {
                    headers = Object.keys(row.data);
                }

                currentChunk.push(row.data);
                totalRows += 1;

                if (currentChunk.length >= chunkSize) {
                    // Process chunk
                    chunkCallback(currentChunk, totalRows);
                    currentChunk = [];
                }
            },
            error: (error) => {
                reject(error);
            },
            complete: () => {
                // Process remaining rows
                if (currentChunk.length > 0) {
                    chunkCallback(currentChunk, totalRows);
                }

                resolve({
                    headers,
                    totalRows,
                });
            },
        });
    });

// ----------------------------------------------------------------------
// Data Normalization
// ----------------------------------------------------------------------

/**
 * Extract recipient domain from email
 */
export const extractDomain = (email) => {
    if (!email) return null;
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : null;
};

/**
 * Parse PMTA timestamp
 */
export const parseTimestamp = (timestamp) => {
    if (!timestamp) return null;

    // PMTA typically uses ISO format or Unix timestamp
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Calculate delivery latency (in seconds)
 */
export const calculateLatency = (timeLogged, timeQueued) => {
    if (!timeLogged || !timeQueued) return null;

    const logged = new Date(timeLogged);
    const queued = new Date(timeQueued);

    if (Number.isNaN(logged.getTime()) || Number.isNaN(queued.getTime())) return null;

    return (logged.getTime() - queued.getTime()) / 1000;
};

/**
 * Normalize row to canonical event model
 */
export const normalizeEvent = (row, fileType, fileId) => ({
    event_type: fileType,
    event_timestamp: parseTimestamp(row.timeLogged),
    file_id: fileId,
    job_id: row.jobId || null,
    sender: row.orig || null,
    recipient: row.rcpt || null,
    recipient_domain: extractDomain(row.rcpt),
    vmta: row.vmta || null,
    vmta_pool: row.vmtaPool || row.vmtaPool2 || null,
    source_ip: row.dlvSourceIp || null,
    destination_ip: row.dlvDestinationIp || null,
    env_id: row.envId || null,
    message_id: null, // Extracted from custom headers if present
    custom_header: null,
    smtp_status: row.dsnStatus || null,
    bounce_category: row.bounceCat || null,
    delivery_latency: calculateLatency(row.timeLogged, row.timeQueued),
    dsn_action: row.dsnAction || null,
    dsn_diag: row.dsnDiag || null,
    raw_data: JSON.stringify(row),
});

/**
 * Process parsed CSV data into normalized events
 */
export const processCSVData = (data, fileType, fileId) =>
    data.map(row => normalizeEvent(row, fileType, fileId));

// ----------------------------------------------------------------------
// File Hashing (for deduplication)
// ----------------------------------------------------------------------

/**
 * Generate hash from file content (first 10KB + last 10KB + size)
 */
export const generateFileHash = async (file) => {
    const chunkSize = 10240; // 10KB
    const chunks = [];

    // Read first chunk
    if (file.size > 0) {
        chunks.push(await file.slice(0, Math.min(chunkSize, file.size)).arrayBuffer());
    }

    // Read last chunk if file is larger
    if (file.size > chunkSize) {
        chunks.push(await file.slice(Math.max(0, file.size - chunkSize)).arrayBuffer());
    }

    // Add file size
    const sizeBuffer = new ArrayBuffer(8);
    new DataView(sizeBuffer).setBigUint64(0, BigInt(file.size));
    chunks.push(sizeBuffer);

    // Combine and hash
    const combined = new Uint8Array(chunks.reduce((acc, chunk) => {
        const arr = new Uint8Array(chunk);
        const newArr = new Uint8Array(acc.length + arr.length);
        newArr.set(acc);
        newArr.set(arr, acc.length);
        return newArr;
    }, new Uint8Array()));

    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
