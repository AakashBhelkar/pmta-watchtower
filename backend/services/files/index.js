/**
 * File services - barrel export
 */
const hashService = require('./hashService');
const duplicateChecker = require('./duplicateChecker');
const zipProcessor = require('./zipProcessor');
const fileProcessor = require('./fileProcessor');

module.exports = {
    // Hash utilities
    calculateFileHash: hashService.calculateFileHash,

    // Duplicate detection
    checkDuplicate: duplicateChecker.checkDuplicate,

    // ZIP processing
    extractCsvFromZip: zipProcessor.extractCsvFromZip,
    cleanupFile: zipProcessor.cleanupFile,

    // File orchestration
    processSingleFile: fileProcessor.processSingleFile,
    processUploadedFiles: fileProcessor.processUploadedFiles
};
