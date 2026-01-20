const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ingestionService = require('../services/ingestionService');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

exports.uploadFiles = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const createdFiles = [];

        const processSingleFile = async (fileName, filePath, fileSize, mimetype) => {
            const dbFile = await prisma.file.create({
                data: {
                    fileName,
                    fileType: 'unknown',
                    fileSize: BigInt(fileSize),
                    processingStatus: 'pending',
                    metadata: { path: filePath, mimetype }
                }
            });
            ingestionService.processFile(dbFile.id, filePath);
            return { id: dbFile.id, fileName, status: 'pending' };
        };

        for (const file of files) {
            if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
                try {
                    const zip = new AdmZip(file.path);
                    const zipEntries = zip.getEntries();

                    for (const entry of zipEntries) {
                        if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv')) {
                            const entryPath = path.join('uploads', `${Date.now()}-${entry.name}`);
                            fs.writeFileSync(entryPath, entry.getData());

                            const result = await processSingleFile(
                                entry.name,
                                entryPath,
                                entry.header.size,
                                'text/csv'
                            );
                            createdFiles.push(result);
                        }
                    }
                    // Cleanup the uploaded zip
                    fs.unlinkSync(file.path);
                } catch (zipError) {
                    console.error('ZIP Error:', zipError);
                }
            } else {
                const result = await processSingleFile(
                    file.originalname,
                    file.path,
                    file.size,
                    file.mimetype
                );
                createdFiles.push(result);
            }
        }

        res.status(201).json({
            message: `${createdFiles.length} files processed (including extracted ZIP content)`,
            files: createdFiles
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
};

exports.getFiles = async (req, res) => {
    try {
        const files = await prisma.file.findMany({
            orderBy: { uploadTime: 'desc' },
            take: 50
        });

        // Format BigInt for JSON serialization
        const formattedFiles = files.map(f => ({
            ...f,
            fileSize: f.fileSize ? f.fileSize.toString() : null
        }));

        res.json(formattedFiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
};

exports.getFileById = async (req, res) => {
    try {
        const file = await prisma.file.findUnique({
            where: { id: req.params.id }
        });
        if (!file) return res.status(404).json({ error: 'File not found' });

        res.json({
            ...file,
            fileSize: file.fileSize ? file.fileSize.toString() : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch file' });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        await prisma.file.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
};
