const prisma = require('../lib/prisma');
const fileServices = require('../services/files');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

exports.uploadFiles = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        throw new AppError('No files uploaded. Please select at least one CSV or ZIP file.', 400, 'NO_FILES');
    }

    const { createdFiles, duplicates, errors } = await fileServices.processUploadedFiles(files);

    res.status(201).json({
        message: `Processing ${createdFiles.length} files`,
        files: createdFiles,
        duplicates: duplicates.length > 0 ? duplicates : undefined,
        errors: errors.length > 0 ? errors : undefined
    });
};

exports.getFiles = async (req, res) => {
    const { status, limit = config.pagination.defaultLimit, offset = 0 } = req.query;

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
};

exports.getFileById = async (req, res) => {
    const file = await prisma.file.findUnique({
        where: { id: req.params.id },
        include: {
            _count: {
                select: { events: true }
            }
        }
    });

    if (!file) {
        throw new AppError('File not found', 404, 'NOT_FOUND');
    }

    res.json({
        ...file,
        fileSize: file.fileSize ? file.fileSize.toString() : null,
        eventCount: file._count.events
    });
};

exports.deleteFile = async (req, res) => {
    const { id } = req.params;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
        throw new AppError('File not found', 404, 'NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
        // Delete physical file if it exists
        if (file.metadata && file.metadata.originalPath) {
            try {
                fileServices.cleanupFile(file.metadata.originalPath);
                console.log(`Deleted physical file: ${file.metadata.originalPath}`);
            } catch (fsError) {
                console.error('Failed to delete physical file:', fsError);
            }
        }

        // Delete related records
        await tx.event.deleteMany({ where: { fileId: id } });
        await tx.aggregateMinute.deleteMany({ where: { fileId: id } });
        await tx.file.delete({ where: { id } });

        // If last file, clear all derived data
        const remainingFiles = await tx.file.count();
        if (remainingFiles === 0) {
            await tx.alert.deleteMany();
            await tx.incident.deleteMany();
            await tx.aggregateMinute.deleteMany();
            await tx.riskScore.deleteMany();
            await tx.event.deleteMany();
            console.log('All files removed; cleared all derived data.');
        }
    });

    res.json({
        message: 'File deleted successfully',
        deletedId: id
    });
};
