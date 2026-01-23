import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { queryEvents } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { MessageTimeline } from './message-timeline';

// ----------------------------------------------------------------------

const EVENT_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'acct', label: 'Accounting' },
    { value: 'tran', label: 'Transaction' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'fbl', label: 'FBL' },
    { value: 'rb', label: 'Rate Block' },
];

export function EventsView() {
    const [events, setEvents] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [filters, setFilters] = useState({
        type: '',
        jobId: '',
        sender: '',
        domain: '',
    });
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const result = await queryEvents({
                ...filters,
                page,
                limit: rowsPerPage,
            });
            setEvents(result.data);
            setTotal(result.pagination.total);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, page, rowsPerPage]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleFilterChange = (field) => (e) => {
        setFilters((prev) => ({ ...prev, [field]: e.target.value }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({ type: '', jobId: '', sender: '', domain: '' });
        setPage(0);
    };

    const handleRowClick = (event) => {
        if (event) {
            setSelectedEvent(event);
            setTimelineOpen(true);
        }
    };

    const getEventTypeChip = (type) => {
        const config = {
            acct: { bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'success.dark', label: 'ACCT' },
            tran: { bgcolor: 'rgba(0, 184, 217, 0.12)', color: 'info.dark', label: 'TRAN' },
            bounce: { bgcolor: 'rgba(255, 86, 48, 0.12)', color: 'error.dark', label: 'BOUNCE' },
            fbl: { bgcolor: 'rgba(255, 107, 53, 0.12)', color: 'warning.dark', label: 'FBL' },
            rb: { bgcolor: 'rgba(145, 158, 171, 0.12)', color: 'text.secondary', label: 'RB' },
        };
        const { bgcolor, color, label } = config[type] || config.acct;
        return (
            <Chip
                size="small"
                label={label}
                sx={{
                    height: 24,
                    minWidth: 65,
                    borderRadius: 1,
                    fontWeight: 500,
                    bgcolor,
                    color,
                }}
            />
        );
    };

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h4">Event Explorer</Typography>
                <Button
                    variant="contained"
                    startIcon={<Iconify icon="mdi:download" />}
                >
                    Export CSV
                </Button>
            </Stack>

            <Card sx={{ mb: 3 }}>
                <CardHeader title="Filters" />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                select
                                label="Event Type"
                                value={filters.type}
                                onChange={handleFilterChange('type')}
                                size="small"
                            >
                                {EVENT_TYPE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Job ID"
                                value={filters.jobId}
                                onChange={handleFilterChange('jobId')}
                                size="small"
                                placeholder="e.g., JOB-1234"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Iconify icon="mdi:magnify" width={20} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Sender"
                                value={filters.sender}
                                onChange={handleFilterChange('sender')}
                                size="small"
                                placeholder="e.g., marketing@"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Domain"
                                value={filters.domain}
                                onChange={handleFilterChange('domain')}
                                size="small"
                                placeholder="e.g., gmail.com"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={1}>
                            <Button fullWidth variant="outlined" onClick={clearFilters} sx={{ height: 40 }}>
                                Clear
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card>
                <CardHeader
                    title={`Events (${total})`}
                    subheader="Real-time data from PostgreSQL"
                />
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Job ID</TableCell>
                                <TableCell>Sender</TableCell>
                                <TableCell>Recipient</TableCell>
                                <TableCell>VMTA</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow
                                    key={event.id}
                                    hover
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => handleRowClick(event)}
                                >
                                    <TableCell>{getEventTypeChip(event.eventType)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                            {event.eventTimestamp ? new Date(event.eventTimestamp).toLocaleString() : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {event.jobId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                            {event.sender}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                            {event.recipient}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{event.vmta}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            color={event.smtpStatus === '250' ? 'success.main' : 'warning.main'}
                                        >
                                            {event.smtpStatus}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {events.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Typography variant="h6" color="text.secondary">No events found</Typography>
                                        <Typography variant="body2">Try uploading some PMTA log files.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </Card>

            <MessageTimeline
                open={timelineOpen}
                onClose={() => setTimelineOpen(false)}
                messageId={selectedEvent?.messageId}
                jobId={selectedEvent?.jobId}
                recipient={selectedEvent?.recipient}
                customHeader={selectedEvent?.customHeader}
            />
        </DashboardContent>
    );
}
