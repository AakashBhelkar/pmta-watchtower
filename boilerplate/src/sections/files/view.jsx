import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { getFiles, deleteFile } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const FILE_TYPE_CONFIG = {
    acct: { bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'success.dark', label: 'ACCT' },
    tran: { bgcolor: 'rgba(0, 184, 217, 0.12)', color: 'info.dark', label: 'TRAN' },
    bounce: { bgcolor: 'rgba(255, 86, 48, 0.12)', color: 'error.dark', label: 'BOUNCE' },
    fbl: { bgcolor: 'rgba(255, 107, 53, 0.12)', color: 'warning.dark', label: 'FBL' },
    rb: { bgcolor: 'rgba(145, 158, 171, 0.12)', color: 'text.secondary', label: 'RB' },
    unknown: { bgcolor: 'rgba(145, 158, 171, 0.12)', color: 'text.secondary', label: 'UNKNOWN' },
};

const STATUS_CONFIG = {
    completed: { bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'success.dark', label: 'Completed' },
    processing: { bgcolor: 'rgba(0, 184, 217, 0.12)', color: 'info.dark', label: 'Processing' },
    pending: { bgcolor: 'rgba(255, 107, 53, 0.12)', color: 'warning.dark', label: 'Pending' },
    error: { bgcolor: 'rgba(255, 86, 48, 0.12)', color: 'error.dark', label: 'Error' },
};

export function FilesView() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');

    const loadFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getFiles();
            // Handle new API format with data property
            const filesList = response.data || response;
            setFiles(Array.isArray(filesList) ? filesList : []);
        } catch (err) {
            console.error('Failed to load files:', err);
            setError('Failed to load files. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // Polling for processing status
    useEffect(() => {
        const hasProcessing = files.some(f => f.processingStatus === 'pending' || f.processingStatus === 'processing');
        let interval;

        if (hasProcessing) {
            interval = setInterval(() => {
                loadFiles();
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [files, loadFiles]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this file and all its events?')) {
            try {
                await deleteFile(id);
                loadFiles();
            } catch (err) {
                console.error('Delete failed:', err);
            }
        }
    };

    const formatFileSize = (bytes) => {
        const b = Number(bytes);
        if (!b || b === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return `${parseFloat((b / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    const filteredFiles = files.filter((file) =>
        file.fileName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h4">File Manager</Typography>
                <TextField
                    size="small"
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Iconify icon="mdi:magnify" width={20} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && files.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading files...
                    </Typography>
                </Stack>
            ) : (
                <Card>
                    <CardHeader title="Uploaded Files" />
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>File Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="right">Size</TableCell>
                                    <TableCell>Upload Time</TableCell>
                                    <TableCell align="right">Rows</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredFiles
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((file) => (
                                        <TableRow key={file.id} hover>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Iconify
                                                        icon="mdi:file-document"
                                                        width={24}
                                                        sx={{ color: 'text.secondary' }}
                                                    />
                                                    <Typography variant="subtitle2">{file.fileName}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={FILE_TYPE_CONFIG[file.fileType]?.label || file.fileType}
                                                    sx={{
                                                        height: 24,
                                                        borderRadius: 1,
                                                        fontWeight: 500,
                                                        bgcolor: FILE_TYPE_CONFIG[file.fileType]?.bgcolor || 'rgba(145, 158, 171, 0.12)',
                                                        color: FILE_TYPE_CONFIG[file.fileType]?.color || 'text.secondary',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">{formatFileSize(file.fileSize)}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {new Date(file.uploadTime).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                {file.rowCount ? file.rowCount.toLocaleString() : '-'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    size="small"
                                                    label={STATUS_CONFIG[file.processingStatus]?.label || file.processingStatus}
                                                    sx={{
                                                        height: 24,
                                                        borderRadius: 1,
                                                        fontWeight: 500,
                                                        bgcolor: STATUS_CONFIG[file.processingStatus]?.bgcolor || 'rgba(145, 158, 171, 0.12)',
                                                        color: STATUS_CONFIG[file.processingStatus]?.color || 'text.secondary',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" justifyContent="center" spacing={0.5}>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(file.id)}>
                                                            <Iconify icon="mdi:delete" width={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {filteredFiles.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                            <Typography variant="body2" color="text.secondary">No files uploaded yet.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={filteredFiles.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </Card>
            )}
        </DashboardContent>
    );
}
