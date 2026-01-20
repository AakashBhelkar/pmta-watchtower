import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { getStats } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

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

    const loadStats = useCallback(async () => {
        try {
            const data = await getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0';
    const deferredRate = stats.sent > 0 ? ((stats.deferred / stats.sent) * 100).toFixed(1) : '0';
    const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(1) : '0';

    return (
        <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 3 }}>
                Global Health Dashboard
            </Typography>

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
                    <TrendChart />
                </Grid>
                <Grid xs={12} lg={4}>
                    <InsightsPanel />
                </Grid>
            </Grid>
        </DashboardContent>
    );
}
