import { memo, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Static color maps - defined outside component to prevent recreation
const COLOR_MAP = {
    primary: '#00B894',
    success: '#22C55E',
    warning: '#FF6B35',
    error: '#FF5630',
    info: '#00B8D9',
};

const BG_COLOR_MAP = {
    primary: 'rgba(0, 184, 148, 0.12)',
    success: 'rgba(34, 197, 94, 0.12)',
    warning: 'rgba(255, 107, 53, 0.12)',
    error: 'rgba(255, 86, 48, 0.12)',
    info: 'rgba(0, 184, 217, 0.12)',
};

function StatsCardComponent({ title, value, color = 'primary', icon, percentage, tooltip }) {
    const colorValue = COLOR_MAP[color];
    const bgColorValue = BG_COLOR_MAP[color];

    // Format number - Pabbly style shows raw numbers without separators for large numbers
    const formatNumber = (num) => {
        const safeNum = typeof num === 'number' ? num : Number(num);
        if (Number.isNaN(safeNum)) return num;
        // For display, still use locale string for readability
        return safeNum.toLocaleString();
    };

    // Memoize card styles to prevent recalculation
    const cardSx = useMemo(() => ({
        p: 3,
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #EBEEF2',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        // Subtle curved gradient accent (Pabbly style)
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            background: `radial-gradient(circle at top right, ${bgColorValue} 0%, transparent 70%)`,
            pointerEvents: 'none',
        },
    }), [bgColorValue]);

    const content = (
        <Card sx={cardSx}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ zIndex: 1 }}>
                    {/* Large bold number first (Pabbly layout) */}
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            lineHeight: 1.2,
                            mb: 0.5,
                            color: 'text.primary',
                        }}
                    >
                        {typeof value === 'number' ? formatNumber(value) : value}
                    </Typography>
                    {/* Small gray label below */}
                    <Typography variant="body2" color="text.secondary">
                        {title}
                    </Typography>
                    {percentage !== undefined && percentage !== null && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                            {percentage}% of total
                        </Typography>
                    )}
                </Box>
                {/* Circular icon on right side (Pabbly style) */}
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: bgColorValue,
                        zIndex: 1,
                    }}
                >
                    <Iconify icon={icon} width={28} sx={{ color: colorValue }} />
                </Box>
            </Stack>
        </Card>
    );

    if (!tooltip) {
        return content;
    }

    return (
        <Tooltip title={tooltip} arrow placement="top">
            <Box sx={{ width: '100%' }}>
                {content}
            </Box>
        </Tooltip>
    );
}

// Memoize the component to prevent unnecessary re-renders
export const StatsCard = memo(StatsCardComponent);
