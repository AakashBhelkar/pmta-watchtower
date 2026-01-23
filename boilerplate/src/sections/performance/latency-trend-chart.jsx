import PropTypes from 'prop-types';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { getLatencyTrend } from 'src/services';

import { formatLatency } from 'src/utils/format-latency';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

// Memoized formatter functions
const formatYAxis = (value) => formatLatency(value).display;
const formatTooltip = (value) => formatLatency(value).display;

function LatencyTrendChartComponent({ dateRange }) {
    const [series, setSeries] = useState([
        { name: 'Avg Latency', data: [] },
        { name: 'P95 Latency', data: [] }
    ]);
    const [categories, setCategories] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const params = dateRange ? {
                from: dateRange.start?.toISOString(),
                to: dateRange.end?.toISOString(),
            } : {};

            const data = await getLatencyTrend(params);

            // Format data for ApexCharts
            // data is array of { time: string, avgLatency: number, p95Latency: number, count: number }
            const cats = data.map(item => {
                const diffHours = dateRange && dateRange.start && dateRange.end
                    ? Math.abs(dateRange.end - dateRange.start) / 36e5
                    : 0;

                const format = diffHours > 24
                    ? { month: 'short', day: 'numeric', hour: '2-digit' }
                    : { hour: '2-digit', minute: '2-digit' };

                return new Date(item.time).toLocaleString([], format);
            });

            const avgData = data.map(item => Number.parseFloat(item.avgLatency) || 0);
            const p95Data = data.map(item => Number.parseFloat(item.p95Latency) || 0);

            setCategories(cats);
            setSeries([
                { name: 'Avg Latency', data: avgData },
                { name: 'P95 Latency', data: p95Data }
            ]);
        } catch (error) {
            console.error('Failed to load latency trend:', error);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Memoize chart base options (stable parts)
    const chartBaseOptions = useMemo(() => ({
        tooltip: {
            y: {
                formatter: formatTooltip,
            },
        },
        yaxis: {
            title: {
                text: 'Latency',
            },
            labels: { formatter: formatYAxis },
        },
    }), []);

    const chartOptions = useChart({
        xaxis: {
            categories,
        },
        ...chartBaseOptions,
    });

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Latency Trends"
                subheader="Delivery latency over time (auto-switches to minutes when above 60s)"
                action={(
                    <Tooltip title="Hover the line to see precise latency. Values over 60s are shown in minutes." arrow>
                        <IconButton size="small">
                            <Typography variant="body2">i</Typography>
                        </IconButton>
                    </Tooltip>
                )}
            />
            <Box sx={{ mt: 3, mx: 3 }}>
                <Chart
                    type="line"
                    series={series}
                    options={chartOptions}
                    height={364}
                />
            </Box>
        </Card>
    );
}

LatencyTrendChartComponent.propTypes = {
    dateRange: PropTypes.shape({
        start: PropTypes.instanceOf(Date),
        end: PropTypes.instanceOf(Date)
    })
};

// Export memoized component
export const LatencyTrendChart = memo(LatencyTrendChartComponent);
