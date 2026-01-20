import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { getVolumeTrend } from 'src/services';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function TrendChart() {
    const theme = useTheme();
    const [series, setSeries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const data = await getVolumeTrend();

            const delivered = [];
            const bounced = [];
            const deferred = [];
            const times = [];

            data.forEach(item => {
                delivered.push(Number(item.delivered));
                bounced.push(Number(item.bounced));
                deferred.push(Number(item.deferred));
                times.push(new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            });

            setSeries([
                { name: 'Delivered', data: delivered },
                { name: 'Bounced', data: bounced },
                { name: 'Deferred', data: deferred },
            ]);
            setCategories(times);
        } catch (error) {
            console.error('Failed to load trend data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const chartOptions = useChart({
        colors: [theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main],
        xaxis: {
            categories: categories,
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (value) => {
                    if (typeof value !== 'undefined') {
                        return `${value.toLocaleString()} messages`;
                    }
                    return value;
                },
            },
        },
    });

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Delivery Trends"
                subheader="Real-time hourly performance"
            />
            <CardContent>
                <Chart
                    type="bar"
                    series={series}
                    options={chartOptions}
                    height={320}
                />
            </CardContent>
        </Card>
    );
}
