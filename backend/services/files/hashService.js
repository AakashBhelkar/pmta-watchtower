/**
 * File hashing service
 */
const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate MD5 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} MD5 hash
 */
function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

module.exports = {
    calculateFileHash
};
