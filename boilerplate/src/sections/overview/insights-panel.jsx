import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { getInsights } from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function InsightsPanel() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadInsights = useCallback(async () => {
        try {
            const data = await getInsights();
            setInsights(data);
        } catch (error) {
            console.error('Failed to load insights:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInsights();
        // Refresh every 5 minutes
        const timer = setInterval(loadInsights, 5 * 60 * 1000);
        return () => clearInterval(timer);
    }, [loadInsights]);

    const getChipColor = (type) => {
        switch (type) {
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            case 'info':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Automated Insights"
                subheader="Rule-based anomaly detection"
            />
            <CardContent>
                <Stack spacing={2}>
                    {loading && <Typography variant="body2" sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>Detecting anomalies...</Typography>}

                    {!loading && insights.length === 0 && (
                        <Box sx={{ py: 5, textAlign: 'center' }}>
                            <Iconify icon="mdi:check-circle" width={48} sx={{ color: 'success.main', mb: 1, opacity: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                No anomalies detected. System health is normal.
                            </Typography>
                        </Box>
                    )}

                    {insights.map((insight) => (
                        <Box
                            key={insight.id}
                            sx={{
                                p: 2,
                                borderRadius: 1.5,
                                bgcolor: 'background.neutral',
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                <Iconify
                                    icon={insight.icon}
                                    width={24}
                                    sx={{
                                        mt: 0.25,
                                        color: `${getChipColor(insight.type)}.main`,
                                    }}
                                />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                        <Typography variant="subtitle2">{insight.title}</Typography>
                                        <Chip
                                            size="small"
                                            label={insight.type}
                                            color={getChipColor(insight.type)}
                                            sx={{ height: 20, fontSize: 10 }}
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {insight.description}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}
