import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import { getRelatedEvents } from 'src/services';
import { Iconify } from 'src/components/iconify';

export function MessageTimeline({ messageId, open, onClose }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && messageId) {
            setLoading(true);
            getRelatedEvents(messageId)
                .then(data => setEvents(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open, messageId]);

    const getEventIcon = (type) => {
        switch (type) {
            case 'acct': return 'mdi:email-send';
            case 'tran': return 'mdi:email-check';
            case 'bounce': return 'mdi:email-remove';
            case 'fbl': return 'mdi:alert-circle';
            case 'rb': return 'mdi:block-helper';
            default: return 'mdi:circle-small';
        }
    };

    const getEventColor = (type) => {
        switch (type) {
            case 'acct': return 'success';
            case 'tran': return 'info';
            case 'bounce': return 'error';
            case 'fbl': return 'warning';
            case 'rb': return 'warning';
            default: return 'grey';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Message Timeline
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    ID: {messageId}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Timeline position="alternate">
                        {events.map((event, index) => (
                            <TimelineItem key={event.id}>
                                <TimelineOppositeContent color="text.secondary">
                                    {new Date(event.eventTimestamp).toLocaleString()}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={getEventColor(event.eventType)}>
                                        <Iconify icon={getEventIcon(event.eventType)} width={20} />
                                    </TimelineDot>
                                    {index < events.length - 1 && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Typography variant="subtitle2" component="span">
                                        {event.eventType.toUpperCase()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {event.smtpStatus && `Status: ${event.smtpStatus}`}
                                        {event.bounceCategory && ` (${event.bounceCategory})`}
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        VMTA: {event.vmta} | IP: {event.sourceIp}
                                    </Typography>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                        {events.length === 0 && (
                            <Typography textAlign="center" sx={{ py: 3, color: 'text.secondary' }}>
                                No related events found.
                            </Typography>
                        )}
                    </Timeline>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

MessageTimeline.propTypes = {
    messageId: PropTypes.string,
    open: PropTypes.bool,
    onClose: PropTypes.func,
};
