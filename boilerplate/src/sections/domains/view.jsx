import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import TableSortLabel from '@mui/material/TableSortLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import { getDomainStats } from 'src/services';
import { DateRangePicker } from 'src/components/date-range-picker';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { formatLatency } from 'src/utils/format-latency';

// ----------------------------------------------------------------------

export function DomainsView() {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date(),
    });

    const loadDomains = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                from: dateRange.start?.toISOString(),
                to: dateRange.end?.toISOString(),
            };
            const data = await getDomainStats(params);
            setDomains(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load domain stats:', err);
            setError('Failed to load domain statistics. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadDomains();
    }, [loadDomains]);

    const handleRefresh = () => {
        loadDomains();
    };

    const getDeliveryChip = (rate) => {
        if (rate >= 97) return <Chip size="small" label="Excellent" color="success" sx={{ height: 22 }} />;
        if (rate >= 95) return <Chip size="small" label="Good" color="info" sx={{ height: 22 }} />;
        if (rate >= 90) return <Chip size="small" label="Fair" color="warning" sx={{ height: 22 }} />;
        return <Chip size="small" label="Poor" color="error" sx={{ height: 22 }} />;
    };

    const totalSent = domains.reduce((sum, d) => sum + (d.messageAttempts || 0), 0);
    const totalDelivered = domains.reduce((sum, d) => sum + (d.delivered || 0), 0);
    const totalBounced = domains.reduce((sum, d) => sum + (d.bounced || 0), 0);
    const totalComplaints = domains.reduce((sum, d) => sum + (d.complaints || 0), 0);

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
                <Typography variant="h4">
                    Domain Performance
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <DateRangePicker
                        start={dateRange.start}
                        end={dateRange.end}
                        onChangeStart={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
                        onChangeEnd={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mdi:refresh" />}
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Sent</Typography>
                        <Typography variant="h4">{totalSent.toLocaleString()}</Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Overall Delivery Rate</Typography>
                        <Typography variant="h4" color="success.main">
                            {totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0}%
                        </Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Bounced</Typography>
                        <Typography variant="h4" color="error.main">{totalBounced.toLocaleString()}</Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Complaint Rate</Typography>
                        <Typography variant="h4" color="warning.main">
                            {totalSent > 0 ? ((totalComplaints / totalSent) * 100).toFixed(3) : 0}%
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Domain Table */}
            <Card>
                <CardHeader
                    title="ISP Comparison"
                    subheader="Performance metrics by recipient domain"
                />
                {loading && domains.length === 0 ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Loading domain statistics...
                        </Typography>
                    </Stack>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel active direction="desc">Domain</TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">Delivered</TableCell>
                                    <TableCell align="right">Bounced</TableCell>
                                    <TableCell align="right">Complaints</TableCell>
                                    <TableCell align="right">Avg Latency</TableCell>
                                    <TableCell align="center">Delivery Rate</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {domains.map((row) => {
                                    const deliveryRate = row.messageAttempts > 0 ? ((row.delivered / row.messageAttempts) * 100) : 0;
                                    return (
                                        <TableRow key={row.domain} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2">{row.domain}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{(row.messageAttempts || 0).toLocaleString()}</TableCell>
                                            <TableCell align="right">{(row.delivered || 0).toLocaleString()}</TableCell>
                                            <TableCell align="right">
                                                <Typography color="error.main">{(row.bounced || 0).toLocaleString()}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{(row.complaints || 0).toLocaleString()}</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Latency shows minutes when above 60s" arrow>
                                                    <span>{formatLatency(row.avgLatency).display}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="center" sx={{ minWidth: 140 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Math.min(deliveryRate, 100)}
                                                        color={deliveryRate >= 95 ? 'success' : deliveryRate >= 90 ? 'warning' : 'error'}
                                                        sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                                                    />
                                                    <Typography variant="body2" sx={{ minWidth: 45 }}>
                                                        {deliveryRate.toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">{getDeliveryChip(deliveryRate)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {domains.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No domain data available. Upload PMTA logs to see statistics.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </DashboardContent>
    );
}

