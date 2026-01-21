const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ingestionService = require('../services/ingestionService');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Calculate MD5 hash of a file
 */
const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

/**
 * Check if file is a duplicate based on hash
 */
const checkDuplicate = async (fileHash) => {
    const existing = await prisma.file.findFirst({
        where: { fileHash }
    });
    return existing;
};

exports.uploadFiles = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'No files uploaded',
                message: 'Please select at least one CSV or ZIP file to upload'
            });
        }

        const createdFiles = [];
        const duplicates = [];
        const errors = [];

        const processSingleFile = async (fileName, filePath, fileSize, mimetype) => {
            try {
                // Calculate file hash for deduplication
                const fileHash = await calculateFileHash(filePath);

                // Check for duplicates
                const existing = await checkDuplicate(fileHash);
                if (existing) {
                    // Clean up the uploaded file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
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
            } catch (err) {
                console.error(`Error processing file ${fileName}:`, err);
                // Clean up on error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return { error: true, fileName, message: err.message };
            }
        };

        for (const file of files) {
            if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
                try {
                    const zip = new AdmZip(file.path);
                    const zipEntries = zip.getEntries();

                    for (const entry of zipEntries) {
                        if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv')) {
                            const entryPath = path.join(__dirname, '..', 'uploads', `${Date.now()}-${entry.name}`);
                            fs.writeFileSync(entryPath, entry.getData());

                            const result = await processSingleFile(
                                entry.name,
                                entryPath,
                                entry.header.size,
                                'text/csv'
                            );

                            if (result.duplicate) {
                                duplicates.push(result);
                            } else if (result.error) {
                                errors.push(result);
                            } else {
                                createdFiles.push(result);
                            }
                        }
                    }
                    // Cleanup the uploaded zip
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
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

                if (result.duplicate) {
                    duplicates.push(result);
                } else if (result.error) {
                    errors.push(result);
                } else {
                    createdFiles.push(result);
                }
            } else {
                // Unsupported file type
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                errors.push({
                    error: true,
                    fileName: file.originalname,
                    message: 'Unsupported file type. Please upload CSV or ZIP files only.'
                });
            }
        }

        res.status(201).json({
            message: `Processing ${createdFiles.length} files`,
            files: createdFiles,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            error: 'Failed to upload files',
            message: error.message
        });
    }
};

exports.getFiles = async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = status ? { processingStatus: status } : {};

        const [files, total] = await prisma.$transaction([
            prisma.file.findMany({
                where,
                orderBy: { uploadTime: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            prisma.file.count({ where })
        ]);

        // Format BigInt for JSON serialization
        const formattedFiles = files.map(f => ({
            ...f,
            fileSize: f.fileSize ? f.fileSize.toString() : null
        }));

        res.json({
            data: formattedFiles,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get Files Error:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
};

exports.getFileById = async (req, res) => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: req.params.id },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            ...file,
            fileSize: file.fileSize ? file.fileSize.toString() : null,
            eventCount: file._count.events
        });
    } catch (error) {
        console.error('Get File Error:', error);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if file exists
        const file = await prisma.file.findUnique({ where: { id } });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete in transaction (events cascade automatically due to onDelete: Cascade)
        await prisma.$transaction(async (tx) => {
            // Delete physical file if it exists and path is available
            if (file.metadata && file.metadata.originalPath) {
                try {
                    const filePath = file.metadata.originalPath;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted physical file: ${filePath}`);
                    }
                } catch (fsError) {
                    console.error('Failed to delete physical file:', fsError);
                    // Continue with DB deletion even if FS deletion fails
                }
            } else if (file.fileName) {
                // Fallback attempt to find file in uploads/ if metadata is missing
                const fallbackPath = path.join(__dirname, '..', 'uploads', file.fileName);
                // Note: we can't be sure about the exact filename if it was renamed by multer
                // so this is a best-effort. Multer usually keeps the random filename.
            }

            await tx.file.delete({ where: { id } });
        });

        res.json({
            message: 'File deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Delete File Error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};

