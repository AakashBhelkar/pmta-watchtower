const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { detectFileType, normalizeEvent } = require('../utils/csvParser');
const analyticsService = require('./analyticsService');

/**
 * Process a PMTA CSV file in chunks
 */
exports.processFile = async (fileId, filePath) => {
    try {
        // 1. Update status to processing
        await prisma.file.update({
            where: { id: fileId },
            data: { processingStatus: 'processing' }
        });

        let detectedFileType = null;
        let rowCount = 0;
        let batch = [];
        const BATCH_SIZE = 1000;

        const fileStream = fs.createReadStream(filePath);

        Papa.parse(fileStream, {
            header: true,
            skipEmptyLines: true,
            chunk: async (results, parser) => {
                // Pause parsing to handle DB ingestion
                parser.pause();

                try {
                    // Detect file type from first chunk headers
                    if (!detectedFileType && results.meta.fields) {
                        detectedFileType = detectFileType(results.meta.fields);
                        await prisma.file.update({
                            where: { id: fileId },
                            data: { fileType: detectedFileType || 'unknown' }
                        });
                    }

                    if (!detectedFileType || detectedFileType === 'unknown') {
                        // If we can't detect, we still try to process but might fail normalization
                    }

                    // Normalize and prepare for bulk insert
                    const normalizedBatch = results.data.map(row =>
                        normalizeEvent(row, detectedFileType, fileId)
                    ).filter(ev => ev !== null);

                    // Chunked database insert
                    if (normalizedBatch.length > 0) {
                        await prisma.event.createMany({
                            data: normalizedBatch,
                            skipDuplicates: true
                        });
                        rowCount += normalizedBatch.length;
                    }

                    parser.resume();
                } catch (dbError) {
                    console.error(`DB Insert Error for file ${fileId}:`, dbError);
                    parser.abort();
                    throw dbError;
                }
            },
            error: async (err) => {
                console.error(`Parse Error for file ${fileId}:`, err);
                await prisma.file.update({
                    where: { id: fileId },
                    data: {
                        processingStatus: 'error',
                        errorLogs: { message: err.message }
                    }
                });
                this.cleanup(filePath);
            },
            complete: async () => {
                await prisma.file.update({
                    where: { id: fileId },
                    data: {
                        processingStatus: 'completed',
                        rowCount: rowCount
                    }
                });
                console.log(`✅ File ${fileId} processed successfully. Total rows: ${rowCount}`);

                // Trigger aggregation and risk scoring
                try {
                    await analyticsService.aggregateFileData(fileId);
                } catch (aggError) {
                    console.error(`Aggregation failed for file ${fileId}:`, aggError);
                }

                this.cleanup(filePath);
            }
        });
    } catch (error) {
        console.error(`Processing service error for file ${fileId}:`, error);
        await prisma.file.update({
            where: { id: fileId },
            data: {
                processingStatus: 'error',
                errorLogs: { message: error.message }
            }
        });
        this.cleanup(filePath);
    }
};

exports.cleanup = (filePath) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Cleanup Error:', unlinkErr);
            });
        }
    });
};
