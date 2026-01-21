import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import { getIncidents } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function IncidentsView() {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getIncidents();
            setIncidents(data);
        } catch (error) {
            console.error('Failed to load incidents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadIncidents();
    }, [loadIncidents]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'grey';
        }
    };

    return (
        <DashboardContent maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h4">System Incidents</Typography>
                <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<Iconify icon="mdi:refresh" />}
                    onClick={loadIncidents}
                >
                    Refresh
                </Button>
            </Stack>

            <Card>
                <CardHeader
                    title="Incident Timeline"
                    subheader="Track system anomalies and alerts"
                />
                <CardContent>
                    {loading ? (
                        <Stack alignItems="center" sx={{ py: 5 }}>
                            <CircularProgress />
                        </Stack>
                    ) : (
                        <Timeline position="alternate">
                            {incidents.map((incident, index) => (
                                <TimelineItem key={incident.id}>
                                    <TimelineOppositeContent color="text.secondary">
                                        <Typography variant="caption" display="block">
                                            {new Date(incident.startTime).toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            {incident.status.toUpperCase()}
                                        </Typography>
                                    </TimelineOppositeContent>
                                    <TimelineSeparator>
                                        <TimelineDot color={getSeverityColor(incident.severity)}>
                                            <Iconify icon="mdi:alert-decagram" width={20} />
                                        </TimelineDot>
                                        {index < incidents.length - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Card variant="outlined" sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900' }}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                <Typography variant="subtitle1" component="span">
                                                    {incident.title}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={incident.severity}
                                                    color={getSeverityColor(incident.severity)}
                                                    sx={{ height: 20, fontSize: '0.75rem', textTransform: 'uppercase' }}
                                                />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {incident.summary}
                                            </Typography>
                                            {incident.entityValue && (
                                                <Chip
                                                    icon={<Iconify icon="mdi:target" />}
                                                    label={`${incident.entityType}: ${incident.entityValue}`}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            )}
                                        </Card>
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                            {incidents.length === 0 && (
                                <Typography textAlign="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No incidents recorded recently.
                                </Typography>
                            )}
                        </Timeline>
                    )}
                </CardContent>
            </Card>
        </DashboardContent>
    );
}
