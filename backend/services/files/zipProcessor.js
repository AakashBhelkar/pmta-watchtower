/**
 * ZIP file extraction service
 */
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

/**
 * Extract CSV files from a ZIP archive
 * @param {string} zipPath - Path to the ZIP file
 * @returns {Array<{name: string, path: string, size: number}>} Extracted CSV file info
 */
function extractCsvFromZip(zipPath) {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const extractedFiles = [];

    const uploadsDir = path.join(__dirname, '../..', config.upload.uploadsDir);

    for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv')) {
            const entryPath = path.join(uploadsDir, `${Date.now()}-${entry.name}`);
            fs.writeFileSync(entryPath, entry.getData());

            extractedFiles.push({
                name: entry.name,
                path: entryPath,
                size: entry.header.size
            });
        }
    }

    return extractedFiles;
}

/**
 * Clean up a file if it exists
 * @param {string} filePath - Path to the file
 */
function cleanupFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

module.exports = {
    extractCsvFromZip,
    cleanupFile
};
