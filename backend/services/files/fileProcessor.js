/**
 * File processing orchestration service
 */
const prisma = require('../../lib/prisma');
const ingestionService = require('../ingestionService');
const { calculateFileHash } = require('./hashService');
const { checkDuplicate } = require('./duplicateChecker');
const { extractCsvFromZip, cleanupFile } = require('./zipProcessor');

/**
 * Process a single file: hash, check duplicates, create DB record, trigger ingestion
 * @param {string} fileName - Original file name
 * @param {string} filePath - Path to the file
 * @param {number} fileSize - File size in bytes
 * @param {string} mimetype - File MIME type
 * @returns {Promise<Object>} Processing result
 */
async function processSingleFile(fileName, filePath, fileSize, mimetype) {
    try {
        const fileHash = await calculateFileHash(filePath);

        const existing = await checkDuplicate(fileHash);
        if (existing) {
            cleanupFile(filePath);
            return {
                duplicate: true,
                fileName,
                existingId: existing.id,
                existingFileName: existing.fileName
            };
        }

        const dbFile = await prisma.file.create({
            data: {
                fileName,
                fileType: 'unknown',
                fileHash,
                fileSize: BigInt(fileSize || 0),
                processingStatus: 'pending',
                metadata: { originalPath: filePath, mimetype }
            }
        });

        // Start async processing
        ingestionService.processFile(dbFile.id, filePath);

        return {
            id: dbFile.id,
            fileName,
            status: 'pending',
            fileHash
        };
    } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        cleanupFile(filePath);
        return { error: true, fileName, message: error.message };
    }
}

/**
 * Process uploaded files (CSV or ZIP)
 * @param {Array} files - Array of uploaded file objects from multer
 * @returns {Promise<{createdFiles: Array, duplicates: Array, errors: Array}>}
 */
async function processUploadedFiles(files) {
    const createdFiles = [];
    const duplicates = [];
    const errors = [];

    for (const file of files) {
        if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
            try {
                const extractedFiles = extractCsvFromZip(file.path);

                for (const extracted of extractedFiles) {
                    const result = await processSingleFile(
                        extracted.name,
                        extracted.path,
                        extracted.size,
                        'text/csv'
                    );

                    categorizeResult(result, createdFiles, duplicates, errors);
                }

                cleanupFile(file.path);
            } catch (zipError) {
                console.error('ZIP Error:', zipError);
                errors.push({
                    error: true,
                    fileName: file.originalname,
                    message: `Failed to extract ZIP: ${zipError.message}`
                });
            }
        } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            const result = await processSingleFile(
                file.originalname,
                file.path,
                file.size,
                file.mimetype
            );

            categorizeResult(result, createdFiles, duplicates, errors);
        } else {
            cleanupFile(file.path);
            errors.push({
                error: true,
                fileName: file.originalname,
                message: 'Unsupported file type. Please upload CSV or ZIP files only.'
            });
        }
    }

    return { createdFiles, duplicates, errors };
}

/**
 * Categorize a processing result into the appropriate array
 */
function categorizeResult(result, createdFiles, duplicates, errors) {
    if (result.duplicate) {
        duplicates.push(result);
    } else if (result.error) {
        errors.push(result);
    } else {
        createdFiles.push(result);
    }
}

module.exports = {
    processSingleFile,
    processUploadedFiles
};
