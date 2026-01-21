import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { getVolumeTrend } from 'src/services';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function TrendChart({ dateRange }) {
    const theme = useTheme();
    const [series, setSeries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const params = dateRange ? {
                from: dateRange.start?.toISOString(),
                to: dateRange.end?.toISOString(),
            } : {};

            const data = await getVolumeTrend(params);

            const delivered = [];
            const bounced = [];
            const deferred = [];
            const times = [];

            (Array.isArray(data) ? data : []).forEach(item => {
                delivered.push(Number(item.delivered));
                bounced.push(Number(item.bounced));
                deferred.push(Number(item.deferred));
                // If filtering by > 24 hours, show date too
                const diffHours = dateRange && dateRange.start && dateRange.end
                    ? Math.abs(dateRange.end - dateRange.start) / 36e5
                    : 0;

                const format = diffHours > 24
                    ? { month: 'short', day: 'numeric', hour: '2-digit' }
                    : { hour: '2-digit', minute: '2-digit' };

                times.push(new Date(item.time).toLocaleString([], format));
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
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const chartOptions = useChart({
        colors: [theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main],
        xaxis: {
            categories,
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
                subheader="Traffic volume over time"
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

TrendChart.propTypes = {
    dateRange: PropTypes.shape({
        start: PropTypes.instanceOf(Date),
        end: PropTypes.instanceOf(Date)
    })
};
