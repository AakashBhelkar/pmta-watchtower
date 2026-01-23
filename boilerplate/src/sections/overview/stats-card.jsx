import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function StatsCard({ title, value, color = 'primary', icon, percentage, tooltip }) {
    const colorMap = {
        primary: 'primary.main',
        success: 'success.main',
        warning: 'warning.main',
        error: 'error.main',
        info: 'info.main',
    };

    const bgColorMap = {
        primary: 'primary.lighter',
        success: 'success.lighter',
        warning: 'warning.lighter',
        error: 'error.lighter',
        info: 'info.lighter',
    };

    const formatNumber = (num) => {
        const safeNum = typeof num === 'number' ? num : Number(num);
        if (Number.isNaN(safeNum)) return num;
        if (safeNum >= 1000000) {
            return `${(safeNum / 1000000).toFixed(1)}M`;
        }
        if (safeNum >= 1000) {
            return `${(safeNum / 1000).toFixed(1)}K`;
        }
        return safeNum.toLocaleString();
    };

    const content = (
        <Card
            sx={{
                height: '100%',
                background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette[color]?.lighter || theme.palette.grey[100]} 0%, ${theme.palette.background.paper} 100%)`,
            }}
        >
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ color: colorMap[color] }}>
                            {typeof value === 'number' ? formatNumber(value) : value}
                        </Typography>
                        {percentage && (
                            <Typography variant="caption" color="text.secondary">
                                {percentage}% of total
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: bgColorMap[color],
                        }}
                    >
                        <Iconify icon={icon} width={28} sx={{ color: colorMap[color] }} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    if (!tooltip) {
        return content;
    }

    return (
        <Tooltip title={tooltip} arrow placement="top" describeChild>
            <Box sx={{ width: '100%' }}>
                {content}
            </Box>
        </Tooltip>
    );
}
