import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { getStats } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { DateRangePicker } from 'src/components/date-range-picker';

import { StatsCard } from './stats-card';
import { TrendChart } from './trend-chart';
import { InsightsPanel } from './insights-panel';

// ----------------------------------------------------------------------

export function OverviewView() {
    const [stats, setStats] = useState({
        messageAttempts: 0,
        deliveredMessages: 0,
        deferredMessages: 0,
        bouncedMessages: 0,
        complaintMessages: 0,
    });
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date(),
    });

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                from: dateRange.start?.toISOString(),
                to: dateRange.end?.toISOString(),
            };
            const data = await getStats(params);
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const handleRefresh = () => {
        loadStats();
    };

    const attempts = stats.messageAttempts || 0;
    const deliveryRate = attempts > 0 ? ((stats.deliveredMessages / attempts) * 100).toFixed(1) : '0';
    const deferredRate = attempts > 0 ? ((stats.deferredMessages / attempts) * 100).toFixed(1) : '0';
    const bounceRate = attempts > 0 ? ((stats.bouncedMessages / attempts) * 100).toFixed(1) : '0';

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
                <Typography variant="h4">
                    Global Health Dashboard
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

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Message Attempts"
                        value={stats.messageAttempts}
                        color="primary"
                        icon="mdi:email-send"
                        tooltip="Unique message attempts (deduped by messageId or job+recipient)."
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Delivered"
                        value={stats.deliveredMessages}
                        color="success"
                        icon="mdi:email-check"
                        percentage={deliveryRate}
                        tooltip="Delivered message attempts / total attempts."
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Deferred"
                        value={stats.deferredMessages}
                        color="warning"
                        icon="mdi:email-sync"
                        percentage={deferredRate}
                        tooltip="Deferred message attempts / total attempts."
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Bounced"
                        value={stats.bouncedMessages}
                        color="error"
                        icon="mdi:email-remove"
                        percentage={bounceRate}
                        tooltip="Bounced message attempts / total attempts."
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Complaints"
                        value={stats.complaintMessages}
                        color="error"
                        icon="mdi:alert-circle"
                        tooltip="Complaint (FBL) message attempts."
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Avg Latency"
                        value={stats.avgLatency}
                        color="info"
                        icon="mdi:speedometer"
                        tooltip="Average delivery latency for delivered attempts (seconds; UI auto-switches to minutes when over 60s)."
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid xs={12} lg={8}>
                    <TrendChart dateRange={dateRange} />
                </Grid>
                <Grid xs={12} lg={4}>
                    <InsightsPanel />
                </Grid>
            </Grid>
        </DashboardContent>
    );
}

