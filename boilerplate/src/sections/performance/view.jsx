import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { getStats, getDomainStats } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { StatsCard } from '../overview/stats-card';
import { LatencyTrendChart } from './latency-trend-chart';

// ----------------------------------------------------------------------

const MOCK_LATENCY_DATA = [
    { domain: 'gmail.com', count: 45200, avgLatency: 2.4, p95Latency: 8.2, status: 'normal' },
    { domain: 'yahoo.com', count: 28100, avgLatency: 3.1, p95Latency: 11.5, status: 'warning' },
    { domain: 'outlook.com', count: 22800, avgLatency: 1.8, p95Latency: 5.4, status: 'normal' },
    { domain: 'hotmail.com', count: 15600, avgLatency: 2.1, p95Latency: 6.8, status: 'normal' },
    { domain: 'aol.com', count: 8400, avgLatency: 4.5, p95Latency: 15.2, status: 'error' },
];

export function PerformanceView() {
    const [stats, setStats] = useState({
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
    });
    const [domainStats, setDomainStats] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const [generalStats, domains] = await Promise.all([
                getStats(),
                getDomainStats()
            ]);

            // We'll need to calculate p95/p99 on the backend later for the stats cards, 
            // for now use the ones we have or placeholders.
            setStats(prev => ({
                ...prev,
                avgLatency: generalStats.avgLatency || 0,
                throughput: generalStats.sent || 0
            }));

            setDomainStats(domains);
        } catch (error) {
            console.error('Failed to load performance data:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 3 }}>
                Performance & Latency
            </Typography>

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
                        value="Calculated"
                        color="warning"
                        icon="mdi:chart-timeline-variant"
                    />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <StatsCard
                        title="P99 Latency"
                        value="Calculated"
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
                    <LatencyTrendChart />
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
