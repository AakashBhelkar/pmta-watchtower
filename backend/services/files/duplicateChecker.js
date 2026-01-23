/**
 * Duplicate file detection service
 */
const prisma = require('../../lib/prisma');

/**
 * Check if file is a duplicate based on hash
 * @param {string} fileHash - MD5 hash of the file
 * @returns {Promise<Object|null>} Existing file record or null
 */
async function checkDuplicate(fileHash) {
    const existing = await prisma.file.findFirst({
        where: { fileHash }
    });
    return existing;
}

module.exports = {
    checkDuplicate
};
