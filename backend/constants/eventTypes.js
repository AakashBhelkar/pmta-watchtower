/**
 * Shared Event Type Constants
 *
 * This module defines event types and their configurations.
 * Used across the application for consistency.
 */

// Event type enum values
const EVENT_TYPES = {
    ACCT: 'acct',
    TRAN: 'tran',
    BOUNCE: 'bounce',
    FBL: 'fbl',
    RB: 'rb',
    UNKNOWN: 'unknown'
};

// List of all valid event types
const EVENT_TYPE_LIST = Object.values(EVENT_TYPES);

// Event type display configuration
const EVENT_TYPE_CONFIG = {
    acct: {
        label: 'Accounting',
        shortLabel: 'ACCT',
        color: 'success',
        description: 'Accounting/transient events'
    },
    tran: {
        label: 'Transaction',
        shortLabel: 'TRAN',
        color: 'info',
        description: 'Delivered transactions'
    },
    bounce: {
        label: 'Bounce',
        shortLabel: 'BOUNCE',
        color: 'error',
        description: 'Bounced messages'
    },
    fbl: {
        label: 'Feedback Loop',
        shortLabel: 'FBL',
        color: 'warning',
        description: 'Spam complaints via FBL'
    },
    rb: {
        label: 'Rate Block',
        shortLabel: 'RB',
        color: 'default',
        description: 'Remote/rate bounces'
    },
    unknown: {
        label: 'Unknown',
        shortLabel: 'UNK',
        color: 'default',
        description: 'Unrecognized event type'
    }
};

// PMTA file type header mappings for detection
const FILE_TYPE_HEADERS = {
    acct: ['type', 'timeLogged', 'timeQueued', 'orig', 'rcpt', 'dsnAction', 'dsnStatus', 'dsnDiag', 'bounceCat', 'vmta', 'jobId'],
    tran: ['type', 'timeLogged', 'timeQueued', 'orig', 'rcpt', 'dsnStatus', 'dsnDiag', 'vmta', 'jobId'],
    bounce: ['type', 'timeLogged', 'bounceCat', 'vmta', 'orig', 'rcpt', 'dsnStatus', 'dsnDiag', 'jobId'],
    fbl: ['type', 'timeLogged', 'orig', 'rcpt', 'vmta', 'jobId'],
    rb: ['type', 'timeLogged', 'vmta', 'domain', 'rbType', 'dsnStatus', 'dsnDiag']
};

// ACCT log type code mappings
const ACCT_TYPE_MAPPINGS = {
    'd': 'tran',     // Delivered
    'b': 'bounce',   // Bounce
    't': 'acct',     // Transient/Deferred
    'f': 'fbl',      // Feedback Loop
    'r': 'rb',       // Remote Bounce
    'p': 'acct'      // Queued (keep as acct)
};

/**
 * Get event type label for display
 */
const getEventTypeLabel = (type) => {
    return EVENT_TYPE_CONFIG[type]?.label || EVENT_TYPE_CONFIG.unknown.label;
};

/**
 * Get event type color for UI
 */
const getEventTypeColor = (type) => {
    return EVENT_TYPE_CONFIG[type]?.color || EVENT_TYPE_CONFIG.unknown.color;
};

/**
 * Check if event type is valid
 */
const isValidEventType = (type) => {
    return EVENT_TYPE_LIST.includes(type);
};

module.exports = {
    EVENT_TYPES,
    EVENT_TYPE_LIST,
    EVENT_TYPE_CONFIG,
    FILE_TYPE_HEADERS,
    ACCT_TYPE_MAPPINGS,
    getEventTypeLabel,
    getEventTypeColor,
    isValidEventType
};
