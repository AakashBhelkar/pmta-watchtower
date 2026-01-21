import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import CircularProgress from '@mui/material/CircularProgress';

import { getStats, getDomainStats } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { DateRangePicker } from 'src/components/date-range-picker';

import { StatsCard } from '../overview/stats-card';
import { LatencyTrendChart } from './latency-trend-chart';

// ----------------------------------------------------------------------

export function PerformanceView() {
    const [stats, setStats] = useState({
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
    });
    const [domainStats, setDomainStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date(),
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                from: dateRange.start?.toISOString(),
                to: dateRange.end?.toISOString(),
            };

            const [generalStats, domains] = await Promise.all([
                getStats(params),
                getDomainStats(params)
            ]);

            setStats(prev => ({
                ...prev,
                avgLatency: generalStats.avgLatency || 0,
                p95Latency: generalStats.p95Latency || 0,
                throughput: generalStats.sent || 0
            }));

            setDomainStats(domains);
        } catch (error) {
            console.error('Failed to load performance data:', error);
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

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
                <Typography variant="h4">
                    Performance & Latency
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

            {loading && (
                <Stack alignItems="center" sx={{ mb: 3 }}>
                    <CircularProgress size={24} />
                </Stack>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Avg Latency"
                        value={`${stats.avgLatency}s`}
                        color="primary"
                        icon="mdi:speedometer"
                    />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <StatsCard
                        title="P95 Latency"
                        value={`${stats.p95Latency}s`}
                        color="warning"
                        icon="mdi:chart-timeline-variant"
                    />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Peak Latency"
                        value={`${Math.max(stats.avgLatency, stats.p95Latency)}s`}
                        color="error"
                        icon="mdi:timer-alert"
                    />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Volume (Sent)"
                        value={stats.throughput}
                        color="success"
                        icon="mdi:trending-up"
                    />
                </Grid>
            </Grid>

            {/* Latency Trends */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12}>
                    <LatencyTrendChart dateRange={dateRange} />
                </Grid>
            </Grid>

            {/* Latency by Domain Table */}
            <Grid container spacing={3}>
                <Grid xs={12}>
                    <Card>
                        <CardHeader title="Performance by Domain" />
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Domain</TableCell>
                                        <TableCell align="right">Delivered</TableCell>
                                        <TableCell align="right">Bounced</TableCell>
                                        <TableCell align="right">Avg Latency</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {domainStats.map((row) => (
                                        <TableRow key={row.domain}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {row.domain}
                                                    {parseFloat(row.avgLatency) > 5 && (
                                                        <Chip size="small" label="slow" color="warning" sx={{ height: 18 }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">{row.delivered}</TableCell>
                                            <TableCell align="right">{row.bounced}</TableCell>
                                            <TableCell align="right">{row.avgLatency}s</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>
        </DashboardContent>
    );
}
