import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import TableSortLabel from '@mui/material/TableSortLabel';

import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

const DOMAIN_DATA = [
    { domain: 'gmail.com', sent: 45200, delivered: 43890, bounced: 520, deferred: 790, complaints: 45, deliveryRate: 97.1 },
    { domain: 'yahoo.com', sent: 28100, delivered: 26750, bounced: 890, deferred: 460, complaints: 28, deliveryRate: 95.2 },
    { domain: 'outlook.com', sent: 22800, delivered: 22340, bounced: 280, deferred: 180, complaints: 12, deliveryRate: 98.0 },
    { domain: 'hotmail.com', sent: 15600, delivered: 15120, bounced: 310, deferred: 170, complaints: 18, deliveryRate: 96.9 },
    { domain: 'aol.com', sent: 8400, delivered: 7560, bounced: 640, deferred: 200, complaints: 35, deliveryRate: 90.0 },
    { domain: 'icloud.com', sent: 5840, delivered: 5720, bounced: 80, deferred: 40, complaints: 5, deliveryRate: 97.9 },
];

export function DomainsView() {
    const getDeliveryChip = (rate) => {
        if (rate >= 97) return <Chip size="small" label="Excellent" color="success" sx={{ height: 22 }} />;
        if (rate >= 95) return <Chip size="small" label="Good" color="info" sx={{ height: 22 }} />;
        if (rate >= 90) return <Chip size="small" label="Fair" color="warning" sx={{ height: 22 }} />;
        return <Chip size="small" label="Poor" color="error" sx={{ height: 22 }} />;
    };

    const totalSent = DOMAIN_DATA.reduce((sum, d) => sum + d.sent, 0);
    const totalDelivered = DOMAIN_DATA.reduce((sum, d) => sum + d.delivered, 0);
    const totalBounced = DOMAIN_DATA.reduce((sum, d) => sum + d.bounced, 0);
    const totalComplaints = DOMAIN_DATA.reduce((sum, d) => sum + d.complaints, 0);

    return (
        <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 3 }}>
                Domain Performance
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Sent</Typography>
                        <Typography variant="h4">{totalSent.toLocaleString()}</Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Overall Delivery Rate</Typography>
                        <Typography variant="h4" color="success.main">
                            {((totalDelivered / totalSent) * 100).toFixed(1)}%
                        </Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Bounced</Typography>
                        <Typography variant="h4" color="error.main">{totalBounced.toLocaleString()}</Typography>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">Complaint Rate</Typography>
                        <Typography variant="h4" color="warning.main">
                            {((totalComplaints / totalSent) * 100).toFixed(3)}%
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Domain Table */}
            <Card>
                <CardHeader
                    title="ISP Comparison"
                    subheader="Performance metrics by recipient domain"
                />
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel active direction="desc">Domain</TableSortLabel>
                                </TableCell>
                                <TableCell align="right">Sent</TableCell>
                                <TableCell align="right">Delivered</TableCell>
                                <TableCell align="right">Bounced</TableCell>
                                <TableCell align="right">Deferred</TableCell>
                                <TableCell align="right">Complaints</TableCell>
                                <TableCell align="center">Delivery Rate</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {DOMAIN_DATA.map((row) => (
                                <TableRow key={row.domain} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2">{row.domain}</Typography>
                                    </TableCell>
                                    <TableCell align="right">{row.sent.toLocaleString()}</TableCell>
                                    <TableCell align="right">{row.delivered.toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Typography color="error.main">{row.bounced.toLocaleString()}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography color="warning.main">{row.deferred.toLocaleString()}</Typography>
                                    </TableCell>
                                    <TableCell align="right">{row.complaints}</TableCell>
                                    <TableCell align="center" sx={{ minWidth: 140 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={row.deliveryRate}
                                                color={row.deliveryRate >= 95 ? 'success' : row.deliveryRate >= 90 ? 'warning' : 'error'}
                                                sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                                            />
                                            <Typography variant="body2" sx={{ minWidth: 45 }}>
                                                {row.deliveryRate}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">{getDeliveryChip(row.deliveryRate)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </DashboardContent>
    );
}
