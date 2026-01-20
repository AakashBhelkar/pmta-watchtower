import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { getLatencyTrend } from 'src/services';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function LatencyTrendChart() {
    const [series, setSeries] = useState([
        { name: 'Avg Latency', data: [] },
        { name: 'P95 Latency', data: [] }
    ]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getLatencyTrend();

                // Format data for ApexCharts
                // data is array of { time: string, avgLatency: number, p95Latency: number, count: number }
                const cats = data.map(item => new Date(item.time).toLocaleString([], { hour: '2-digit', minute: '2-digit' }));
                const avgData = data.map(item => parseFloat(item.avgLatency).toFixed(2));
                const p95Data = data.map(item => parseFloat(item.p95Latency).toFixed(2));

                setCategories(cats);
                setSeries([
                    { name: 'Avg Latency', data: avgData },
                    { name: 'P95 Latency', data: p95Data }
                ]);
            } catch (error) {
                console.error('Failed to load latency trend:', error);
            }
        };

        loadData();
    }, []);

    const chartOptions = useChart({
        xaxis: {
            categories,
        },
        tooltip: {
            y: {
                formatter: (value) => `${value}s`,
            },
        },
        yaxis: {
            title: {
                text: 'Seconds',
            },
        },
    });

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title="Latency Trends" subheader="Delivery latency over time (seconds)" />
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
