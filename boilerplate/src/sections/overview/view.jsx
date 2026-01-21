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
        sent: 0,
        delivered: 0,
        deferred: 0,
        bounced: 0,
        complaints: 0,
        rbEvents: 0,
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

    const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0';
    const deferredRate = stats.sent > 0 ? ((stats.deferred / stats.sent) * 100).toFixed(1) : '0';
    const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(1) : '0';

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
                        title="Sent"
                        value={stats.sent}
                        color="primary"
                        icon="mdi:email-send"
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Delivered"
                        value={stats.delivered}
                        color="success"
                        icon="mdi:email-check"
                        percentage={deliveryRate}
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Deferred"
                        value={stats.deferred}
                        color="warning"
                        icon="mdi:email-sync"
                        percentage={deferredRate}
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Bounced"
                        value={stats.bounced}
                        color="error"
                        icon="mdi:email-remove"
                        percentage={bounceRate}
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="Complaints"
                        value={stats.complaints}
                        color="error"
                        icon="mdi:alert-circle"
                    />
                </Grid>
                <Grid xs={12} sm={6} md={4} lg={2}>
                    <StatsCard
                        title="RB Events"
                        value={stats.rbEvents}
                        color="warning"
                        icon="mdi:block-helper"
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

