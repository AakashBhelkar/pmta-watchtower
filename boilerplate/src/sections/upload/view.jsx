import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { uploadFiles } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const FILE_TYPES = {
    acct: { label: 'Accounting', color: 'success', description: 'Final delivery outcome records' },
    tran: { label: 'Transaction', color: 'info', description: 'SMTP transaction performance logs' },
    bounce: { label: 'Bounce', color: 'error', description: 'Failure classification records' },
    fbl: { label: 'FBL', color: 'warning', description: 'Complaint/feedback loop data' },
    rb: { label: 'Rate Block', color: 'default', description: 'Reputation/rate blocking events' },
};

export function UploadView() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const processFiles = async (fileList) => {
        const newFiles = await Promise.all(
            Array.from(fileList).map(async (file) => {
                let detectedType = null;
                const fileName = file.name.toLowerCase();

                Object.keys(FILE_TYPES).forEach((type) => {
                    if (fileName.includes(type)) {
                        detectedType = type;
                    }
                });

                return {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    name: file.name,
                    size: file.size,
                    detectedType,
                    status: 'pending',
                    progress: 0,
                    rowCount: 0,
                    errors: [],
                };
            })
        );

        setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    const removeFile = (id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleUpload = async () => {
        setUploading(true);
        const pendingFiles = files.filter((f) => f.status === 'pending');

        try {
            // Mark all pending as processing
            setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'processing', progress: 50 } : f));

            const fileObjects = pendingFiles.map(f => f.file);
            await uploadFiles(fileObjects);

            setFiles(prev => prev.map(f => f.status === 'processing' ? { ...f, status: 'completed', progress: 100 } : f));
            showSnackbar(`Successfully uploaded ${pendingFiles.length} files. Check progress in File Manager.`);
        } catch (error) {
            console.error('Upload Error:', error);
            setFiles(prev => prev.map(f => f.status === 'processing' ? { ...f, status: 'error', errors: [error.message] } : f));
            showSnackbar('Failed to upload files', 'error');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 3 }}>
                Upload Files
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">System Connected</Typography>
                <Typography variant="body2">
                    Local Backend & PostgreSQL are connected. Ingestion is handled server-side for high performance.
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                <Grid xs={12} lg={8}>
                    <Card>
                        <CardHeader
                            title="Upload PMTA CSV Files"
                            subheader="Files are streamed to the backend database instantly"
                        />
                        <CardContent>
                            <Box
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                sx={{
                                    p: 5,
                                    border: '2px dashed',
                                    borderColor: dragActive ? 'primary.main' : 'divider',
                                    borderRadius: 2,
                                    bgcolor: dragActive ? 'primary.lighter' : 'background.neutral',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'primary.lighter',
                                    },
                                }}
                                component="label"
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept=".csv,.txt"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <Iconify
                                    icon="mdi:cloud-upload"
                                    width={64}
                                    sx={{ color: 'primary.main', mb: 2 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Drop files here or click to upload
                                </Typography>
                            </Box>

                            {files.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Stack spacing={2}>
                                        {files.map((fileItem) => (
                                            <Box
                                                key={fileItem.id}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 1,
                                                    bgcolor: fileItem.status === 'error' ? 'error.lighter' : 'background.neutral',
                                                    border: '1px solid',
                                                    borderColor: fileItem.status === 'error' ? 'error.main' : 'divider',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <Iconify
                                                        icon={
                                                            fileItem.status === 'completed'
                                                                ? 'mdi:check-circle'
                                                                : fileItem.status === 'error'
                                                                    ? 'mdi:alert-circle'
                                                                    : 'mdi:file-document'
                                                        }
                                                        width={32}
                                                        sx={{
                                                            color: fileItem.status === 'completed'
                                                                ? 'success.main'
                                                                : fileItem.status === 'error'
                                                                    ? 'error.main'
                                                                    : 'text.secondary'
                                                        }}
                                                    />
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Typography variant="subtitle2">{fileItem.name}</Typography>
                                                            {fileItem.detectedType && (
                                                                <Chip
                                                                    size="small"
                                                                    label={FILE_TYPES[fileItem.detectedType].label}
                                                                    color={FILE_TYPES[fileItem.detectedType].color}
                                                                    sx={{ height: 20 }}
                                                                />
                                                            )}
                                                        </Stack>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatFileSize(fileItem.size)}
                                                        </Typography>
                                                        {fileItem.status === 'processing' && (
                                                            <LinearProgress sx={{ mt: 1 }} />
                                                        )}
                                                    </Box>
                                                    {fileItem.status === 'pending' && !uploading && (
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => removeFile(fileItem.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>

                                    {files.some(f => f.status === 'pending') && (
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<Iconify icon="mdi:upload" />}
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            sx={{ mt: 3 }}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload & Process'}
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid xs={12} lg={4}>
                    <Card>
                        <CardHeader title="Supported File Types" />
                        <CardContent>
                            <Stack spacing={2}>
                                {Object.entries(FILE_TYPES).map(([key, value]) => (
                                    <Box
                                        key={key}
                                        sx={{
                                            p: 2,
                                            borderRadius: 1,
                                            bgcolor: 'background.neutral',
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                            <Chip size="small" label={key.toUpperCase()} color={value.color} />
                                            <Typography variant="subtitle2">{value.label}</Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {value.description}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </DashboardContent>
    );
}
