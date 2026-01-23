import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function StatsCard({ title, value, color = 'primary', icon, percentage, tooltip }) {
    const colorMap = {
        primary: '#00B894',
        success: '#22C55E',
        warning: '#FF6B35',
        error: '#FF5630',
        info: '#00B8D9',
    };

    const bgColorMap = {
        primary: 'rgba(0, 184, 148, 0.12)',
        success: 'rgba(34, 197, 94, 0.12)',
        warning: 'rgba(255, 107, 53, 0.12)',
        error: 'rgba(255, 86, 48, 0.12)',
        info: 'rgba(0, 184, 217, 0.12)',
    };

    // Format number - Pabbly style shows raw numbers without separators for large numbers
    const formatNumber = (num) => {
        const safeNum = typeof num === 'number' ? num : Number(num);
        if (Number.isNaN(safeNum)) return num;
        // For display, still use locale string for readability
        return safeNum.toLocaleString();
    };

    const content = (
        <Card
            sx={{
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
                    background: `radial-gradient(circle at top right, ${bgColorMap[color]} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                },
            }}
        >
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
                        bgcolor: bgColorMap[color],
                        zIndex: 1,
                    }}
                >
                    <Iconify icon={icon} width={28} sx={{ color: colorMap[color] }} />
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
