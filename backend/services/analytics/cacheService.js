/**
 * Simple in-memory cache service with TTL support
 */
const config = require('../../config');

const cache = new Map();

const CACHE_TTL = {
    insights: config.cache?.insightsTtl || 60 * 1000,      // 1 minute
    incidents: config.cache?.incidentsTtl || 60 * 1000,   // 1 minute
    fileCount: config.cache?.fileCountTtl || 30 * 1000,   // 30 seconds
    stats: config.cache?.statsTtl || 30 * 1000,           // 30 seconds
};

/**
 * Get cached data if not expired
 */
function getCached(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
    }
    return item.data;
}

/**
 * Set data in cache with TTL
 */
function setCache(key, data, ttl) {
    cache.set(key, { data, expiry: Date.now() + ttl });
}

/**
 * Invalidate cache entries matching a pattern
 */
function invalidateCache(pattern) {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
}

/**
 * Clear all cache entries
 */
function clearCache() {
    cache.clear();
}

module.exports = {
    getCached,
    setCache,
    invalidateCache,
    clearCache,
    CACHE_TTL
};
