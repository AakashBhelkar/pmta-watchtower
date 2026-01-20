import { memo } from 'react';
import ApexChart from 'react-apexcharts';

import Box from '@mui/material/Box';
import { useTheme, styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

const ChartWrapper = styled(Box)(({ theme }) => ({
    '& .apexcharts-canvas': {
        '& .apexcharts-tooltip': {
            color: theme.palette.text.primary,
            boxShadow: theme.customShadows?.z24 || theme.shadows[24],
            borderRadius: theme.shape.borderRadius * 1.25,
            '&.apexcharts-theme-light': {
                borderColor: 'transparent',
                backgroundColor: theme.palette.background.paper,
            },
            '&.apexcharts-theme-dark': {
                borderColor: 'transparent',
                backgroundColor: theme.palette.grey[800],
            },
            '& .apexcharts-tooltip-title': {
                textAlign: 'center',
                fontWeight: theme.typography.fontWeightBold,
                backgroundColor: theme.palette.background.neutral,
                color: theme.palette.text.secondary,
            },
        },
        '& .apexcharts-xaxistooltip': {
            color: theme.palette.text.primary,
            boxShadow: theme.customShadows?.z24 || theme.shadows[24],
            borderRadius: theme.shape.borderRadius * 1.25,
            '&.apexcharts-theme-light': {
                borderColor: 'transparent',
                backgroundColor: theme.palette.background.paper,
            },
            '&.apexcharts-theme-dark': {
                borderColor: 'transparent',
                backgroundColor: theme.palette.grey[800],
            },
            '&:before': { borderBottomColor: 'transparent' },
            '&:after': { borderBottomColor: theme.palette.background.paper },
        },
        '& .apexcharts-legend': {
            padding: 0,
        },
        '& .apexcharts-legend-series': {
            display: 'inline-flex !important',
            alignItems: 'center',
        },
        '& .apexcharts-legend-marker': {
            marginRight: 8,
        },
        '& .apexcharts-legend-text': {
            lineHeight: '18px',
            textTransform: 'capitalize',
        },
    },
}));

function Chart({ ...other }) {
    return (
        <ChartWrapper>
            <ApexChart {...other} />
        </ChartWrapper>
    );
}

export default memo(Chart);

export function useChart(options) {
    const theme = useTheme();

    const LABEL_TOTAL = {
        show: true,
        label: 'Total',
        color: theme.palette.text.secondary,
        fontSize: theme.typography.subtitle2.fontSize,
        fontWeight: theme.typography.subtitle2.fontWeight,
        lineHeight: theme.typography.subtitle2.lineHeight,
    };

    const LABEL_VALUE = {
        offsetY: 8,
        color: theme.palette.text.primary,
        fontSize: theme.typography.h3.fontSize,
        fontWeight: theme.typography.h3.fontWeight,
        lineHeight: theme.typography.h3.lineHeight,
    };

    const baseOptions = {
        // Colors
        colors: [
            theme.palette.primary.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            theme.palette.error.main,
            theme.palette.success.main,
            theme.palette.warning.dark,
            theme.palette.success.dark,
            theme.palette.info.dark,
            theme.palette.error.dark,
        ],

        // Chart
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            // animations: { enabled: false },
            foreColor: theme.palette.text.disabled,
            fontFamily: theme.typography.fontFamily,
        },

        // States
        states: {
            hover: {
                filter: {
                    type: 'lighten',
                    value: 0.04,
                },
            },
            active: {
                filter: {
                    type: 'darken',
                    value: 0.88,
                },
            },
        },

        // Fill
        fill: {
            opacity: 1,
            gradient: {
                type: 'vertical',
                shadeIntensity: 0,
                opacityFrom: 0.4,
                opacityTo: 0,
                stops: [0, 100],
            },
        },

        // DataLabels
        dataLabels: { enabled: false },

        // Stroke
        stroke: {
            width: 3,
            curve: 'smooth',
            lineCap: 'round',
        },

        // Grid
        grid: {
            strokeDashArray: 3,
            borderColor: theme.palette.divider,
            xaxis: {
                lines: { show: false },
            },
        },

        // Xaxis
        xaxis: {
            axisBorder: { show: false },
            axisTicks: { show: false },
        },

        // Markers
        markers: {
            size: 0,
            strokeColors: theme.palette.background.paper,
        },

        // Tooltip
        tooltip: {
            x: { show: false },
        },

        // Legend
        legend: {
            show: true,
            fontSize: 13,
            position: 'top',
            horizontalAlign: 'right',
            markers: { radius: 12 },
            fontWeight: 500,
            itemMargin: { horizontal: 8 },
            labels: { color: theme.palette.text.primary },
        },

        // plotOptions
        plotOptions: {
            // Bar
            bar: {
                borderRadius: 4,
                columnWidth: '28%',
                borderRadiusApplication: 'end',
            },
            // Pie + Donut
            pie: {
                donut: {
                    labels: {
                        show: true,
                        value: LABEL_VALUE,
                        total: LABEL_TOTAL,
                    },
                },
            },
            // Radialbar
            radialBar: {
                track: {
                    strokeWidth: '100%',
                    background: theme.palette.grey[500_16],
                },
                dataLabels: {
                    value: LABEL_VALUE,
                    total: LABEL_TOTAL,
                },
            },
            // Radar
            radar: {
                polygons: {
                    fill: { colors: ['transparent'] },
                    strokeColors: theme.palette.divider,
                    connectorColors: theme.palette.divider,
                },
            },
            // Polar Area
            polarArea: {
                rings: { strokeColor: theme.palette.divider },
                spokes: { connectorColor: theme.palette.divider },
            },
        },

        // Responsive
        responsive: [
            {
                breakpoint: theme.breakpoints.values.sm,
                options: {
                    plotOptions: { bar: { columnWidth: '40%' } },
                },
            },
            {
                breakpoint: theme.breakpoints.values.md,
                options: {
                    plotOptions: { bar: { columnWidth: '32%' } },
                },
            },
        ],
    };

    return { ...baseOptions, ...options };
}
