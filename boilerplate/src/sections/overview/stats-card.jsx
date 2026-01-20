import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function StatsCard({ title, value, color = 'primary', icon, percentage }) {
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
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    return (
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
                            {formatNumber(value)}
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
}
