import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { getSenderStats } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SENDER_DATA = [
    { id: 1, sender: 'marketing@acme.com', jobCount: 45, sent: 125000, bounceRate: 2.1, complaintRate: 0.12, riskScore: 'low' },
    { id: 2, sender: 'promo@deals.com', jobCount: 28, sent: 89000, bounceRate: 5.8, complaintRate: 0.35, riskScore: 'high' },
    { id: 3, sender: 'news@updates.co', jobCount: 62, sent: 156000, bounceRate: 1.5, complaintRate: 0.08, riskScore: 'low' },
    { id: 4, sender: 'sales@shopnow.com', jobCount: 34, sent: 78000, bounceRate: 3.9, complaintRate: 0.22, riskScore: 'medium' },
    { id: 5, sender: 'alerts@notify.io', jobCount: 89, sent: 234000, bounceRate: 0.8, complaintRate: 0.04, riskScore: 'low' },
    { id: 6, sender: 'bulk@massmail.net', jobCount: 12, sent: 45000, bounceRate: 8.2, complaintRate: 0.58, riskScore: 'critical' },
    { id: 7, sender: 'info@company.org', jobCount: 56, sent: 112000, bounceRate: 2.4, complaintRate: 0.15, riskScore: 'medium' },
    { id: 8, sender: 'support@help.com', jobCount: 78, sent: 189000, bounceRate: 1.2, complaintRate: 0.06, riskScore: 'low' },
];

export function SendersView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [senders, setSenders] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const data = await getSenderStats();

            // Calculate rates and risk scores
            const enriched = data.map((s, idx) => {
                const bounceRate = s.total > 0 ? (s.bounced / s.total) * 100 : 0;
                const complaintRate = s.total > 0 ? (s.complaints / s.total) * 100 : 0;

                let riskScore = 'low';
                if (bounceRate > 10 || complaintRate > 0.5) riskScore = 'critical';
                else if (bounceRate > 5 || complaintRate > 0.2) riskScore = 'high';
                else if (bounceRate > 2 || complaintRate > 0.1) riskScore = 'medium';

                return {
                    id: idx,
                    sender: s.sender,
                    total: s.total,
                    delivered: s.delivered,
                    bounceRate: bounceRate.toFixed(2),
                    complaintRate: complaintRate.toFixed(2),
                    riskScore
                };
            });

            setSenders(enriched);
        } catch (error) {
            console.error('Failed to load senders:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getRiskChip = (risk) => {
        const config = {
            low: { color: 'success', icon: 'mdi:shield-check' },
            medium: { color: 'warning', icon: 'mdi:shield-alert' },
            high: { color: 'error', icon: 'mdi:shield-alert' },
            critical: { color: 'error', icon: 'mdi:shield-off' },
        };
        const { color, icon } = config[risk] || config.low;
        return (
            <Chip
                size="small"
                label={risk.toUpperCase()}
                color={color}
                icon={<Iconify icon={icon} width={16} />}
                sx={{ height: 24 }}
            />
        );
    };

    const criticalCount = senders.filter((s) => s.riskScore === 'critical').length;
    const highRiskCount = senders.filter((s) => s.riskScore === 'high').length;
    const avgComplaintRate = senders.length > 0
        ? (senders.reduce((sum, s) => sum + parseFloat(s.complaintRate), 0) / senders.length).toFixed(2)
        : '0.00';

    return (
        <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 3 }}>
                Sender / User Risk
            </Typography>

            {/* Risk Summary */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: 'error.lighter' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
                                <Iconify icon="mdi:shield-off" width={28} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Critical Risk</Typography>
                                <Typography variant="h4" color="error.dark">{criticalCount}</Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: 'warning.lighter' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                                <Iconify icon="mdi:shield-alert" width={28} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">High Risk</Typography>
                                <Typography variant="h4" color="warning.dark">{highRiskCount}</Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Senders</Typography>
                        <Typography variant="h4">{senders.length}</Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Avg Complaint Rate</Typography>
                        <Typography variant="h4">
                            {avgComplaintRate}%
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Sender Table */}
            <Card>
                <CardHeader
                    title="Sender Risk Analysis"
                    subheader="Identify senders affecting reputation"
                />
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Sender</TableCell>
                                <TableCell align="right">Jobs</TableCell>
                                <TableCell align="right">Total Sent</TableCell>
                                <TableCell align="right">Bounce Rate</TableCell>
                                <TableCell align="right">Complaint Rate</TableCell>
                                <TableCell align="center">Risk Score</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {senders
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2">{row.sender}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{row.total.toLocaleString()}</TableCell>
                                        <TableCell align="right">{row.delivered.toLocaleString()}</TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                color={parseFloat(row.bounceRate) > 5 ? 'error.main' : parseFloat(row.bounceRate) > 3 ? 'warning.main' : 'text.primary'}
                                            >
                                                {row.bounceRate}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                color={parseFloat(row.complaintRate) > 0.3 ? 'error.main' : parseFloat(row.complaintRate) > 0.15 ? 'warning.main' : 'text.primary'}
                                            >
                                                {row.complaintRate}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">{getRiskChip(row.riskScore)}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={senders.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Card>
        </DashboardContent>
    );
}
