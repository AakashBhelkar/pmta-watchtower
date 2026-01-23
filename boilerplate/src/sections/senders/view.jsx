import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { getSenderStats } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { DateRangePicker } from 'src/components/date-range-picker';

import { StatsCard } from '../overview/stats-card';

// ----------------------------------------------------------------------

export function SendersView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [senders, setSenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date(),
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                from: dateRange.start?.toISOString(),
                to: dateRange.end?.toISOString(),
            };
            const data = await getSenderStats(params);

            const enriched = (Array.isArray(data) ? data : []).map((s, idx) => ({
                id: idx,
                sender: s.sender,
                total: s.messageAttempts || 0,
                delivered: s.delivered || 0,
                jobCount: s.jobCount || 0,
                bounceRate: (s.bounceRate || '0.00').toString(),
                complaintRate: (s.complaintRate || '0.00').toString(),
                riskScore: s.riskLevel || 'low'
            }));

            setSenders(enriched);
        } catch (err) {
            console.error('Failed to load senders:', err);
            setError('Failed to load sender statistics. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData();
    };

    const getRiskChip = (risk) => {
        const config = {
            low: { bgcolor: 'rgba(34, 197, 94, 0.12)', color: 'success.dark', icon: 'mdi:shield-check' },
            medium: { bgcolor: 'rgba(255, 107, 53, 0.12)', color: 'warning.dark', icon: 'mdi:shield-alert' },
            high: { bgcolor: 'rgba(255, 86, 48, 0.12)', color: 'error.dark', icon: 'mdi:shield-alert' },
            critical: { bgcolor: 'rgba(255, 86, 48, 0.16)', color: 'error.dark', icon: 'mdi:shield-off' },
        };
        const { bgcolor, color, icon } = config[risk] || config.low;
        return (
            <Chip
                size="small"
                label={risk.toUpperCase()}
                icon={<Iconify icon={icon} width={16} sx={{ color: `${color} !important` }} />}
                sx={{
                    height: 24,
                    borderRadius: 1,
                    fontWeight: 500,
                    bgcolor,
                    color,
                    '& .MuiChip-icon': { color },
                }}
            />
        );
    };

    const criticalCount = senders.filter((s) => s.riskScore === 'critical').length;
    const highRiskCount = senders.filter((s) => s.riskScore === 'high').length;
    const avgComplaintRate = senders.length > 0
        ? (senders.reduce((sum, s) => sum + parseFloat(s.complaintRate), 0) / senders.length).toFixed(2)
        : '0.00';

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
                <Typography variant="h4">
                    Sender / User Risk
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

            {loading && senders.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading sender statistics...
                    </Typography>
                </Stack>
            ) : (
                <>
                    {/* Risk Summary */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid xs={12} sm={6} md={3}>
                            <StatsCard
                                title="Critical Risk"
                                value={criticalCount}
                                color="error"
                                icon="mdi:shield-off"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <StatsCard
                                title="High Risk"
                                value={highRiskCount}
                                color="warning"
                                icon="mdi:shield-alert"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <StatsCard
                                title="Total Senders"
                                value={senders.length}
                                color="primary"
                                icon="mdi:account-group"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <StatsCard
                                title="Avg Complaint Rate"
                                value={`${avgComplaintRate}%`}
                                color="info"
                                icon="mdi:chart-line"
                            />
                        </Grid>
                    </Grid>

                    {/* Sender Table */}
                    <Card>
                        <CardHeader
                            title="Sender Risk Analysis"
                            subheader="Identify senders affecting reputation"
                        />
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sender</TableCell>
                                        <TableCell align="right">Jobs</TableCell>
                                        <TableCell align="right">Total Sent</TableCell>
                                        <TableCell align="right">Bounce Rate</TableCell>
                                        <TableCell align="right">Complaint Rate</TableCell>
                                        <TableCell align="center">Risk Score</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {senders
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell>
                                                    <Typography variant="subtitle2">{row.sender}</Typography>
                                                </TableCell>
                                                <TableCell align="right">{row.jobCount.toLocaleString()}</TableCell>
                                                <TableCell align="right">{row.total.toLocaleString()}</TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        color={parseFloat(row.bounceRate) > 5 ? 'error.main' : parseFloat(row.bounceRate) > 3 ? 'warning.main' : 'text.primary'}
                                                    >
                                                        {row.bounceRate}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        color={parseFloat(row.complaintRate) > 0.3 ? 'error.main' : parseFloat(row.complaintRate) > 0.15 ? 'warning.main' : 'text.primary'}
                                                    >
                                                        {row.complaintRate}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">{getRiskChip(row.riskScore)}</TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={senders.length}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                        />
                    </Card>
                </>
            )}
        </DashboardContent>
    );
}

