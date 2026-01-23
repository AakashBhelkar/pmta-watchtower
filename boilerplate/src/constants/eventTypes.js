/**
 * Shared Event Type Constants (Frontend)
 *
 * This module defines event types and their configurations for the UI.
 * Keeps frontend and backend in sync.
 */

// Event type enum values
export const EVENT_TYPES = {
    ACCT: 'acct',
    TRAN: 'tran',
    BOUNCE: 'bounce',
    FBL: 'fbl',
    RB: 'rb',
    UNKNOWN: 'unknown'
};

// List of all valid event types
export const EVENT_TYPE_LIST = Object.values(EVENT_TYPES);

// Event type options for select dropdowns
export const EVENT_TYPE_OPTIONS = [
    { value: 'acct', label: 'Accounting' },
    { value: 'tran', label: 'Transaction' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'fbl', label: 'Feedback Loop' },
    { value: 'rb', label: 'Rate Block' }
];

// Event type display configuration with colors
export const EVENT_TYPE_CONFIG = {
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

/**
 * Get event type label for display
 */
export const getEventTypeLabel = (type) =>
    EVENT_TYPE_CONFIG[type]?.label || EVENT_TYPE_CONFIG.unknown.label;

/**
 * Get event type color for UI
 */
export const getEventTypeColor = (type) =>
    EVENT_TYPE_CONFIG[type]?.color || EVENT_TYPE_CONFIG.unknown.color;

/**
 * Get short label for chips/badges
 */
export const getEventTypeShortLabel = (type) =>
    EVENT_TYPE_CONFIG[type]?.shortLabel || EVENT_TYPE_CONFIG.unknown.shortLabel;

/**
 * Check if event type is valid
 */
export const isValidEventType = (type) => EVENT_TYPE_LIST.includes(type);
