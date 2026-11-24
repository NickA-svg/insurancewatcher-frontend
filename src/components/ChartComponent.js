import * as React from 'react';
import { ResponsiveChartContainer } from '@mui/x-charts/ResponsiveChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { Box, Button, Card, CircularProgress, Collapse, Stack, Typography, useMediaQuery } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;
const sentimentFormatter = (v) => (v === null || v === undefined ? '–' : v.toFixed(3));

export default function SentimentChart({ status, tag, data }) {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [open, setOpen] = React.useState(!isMobile);
    const hasSentiment = data && data.sentiment && data.sentiment.some((v) => v !== null);
    const label = tag === 'All' ? 'Market' : tag;

    return (
        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                    <Typography variant="subtitle1">{label} sentiment tracker</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Monthly average tone of {label === 'Market' ? 'property, casualty and reinsurance' : label.toLowerCase()} headlines against the S&amp;P 500 Insurance index
                    </Typography>
                </Box>
                <Button
                    size="small"
                    color="primary"
                    onClick={() => setOpen(!open)}
                    endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ flexShrink: 0 }}
                >
                    {open ? 'Hide' : 'Show'}
                </Button>
            </Stack>
            <Collapse in={open} unmountOnExit>
                <Box sx={{ height: isMobile ? 280 : 340, mt: 1 }}>
                    {status === 'loading' && <div className="loader-div"><CircularProgress color="secondary" /></div>}
                    {status === 'error' && <Typography color="text.secondary" sx={{ p: 3 }}>The chart couldn't load. Please try again shortly.</Typography>}
                    {status === 'ready' && !hasSentiment && (
                        <Typography color="text.secondary" sx={{ p: 3 }}>Not enough articles to chart this filter yet.</Typography>
                    )}
                    {status === 'ready' && hasSentiment && (
                        <ResponsiveChartContainer
                            xAxis={[{
                                scaleType: 'band',
                                data: data.xAxis,
                                id: 'months',
                                tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 11 },
                                tickLabelInterval: (value, index) => index % (isMobile ? 6 : 3) === 0,
                            }]}
                            yAxis={[{ id: 'sentiment' }, { id: 'stock' }]}
                            series={[
                                { type: 'line', id: 'stock', yAxisKey: 'stock', data: data.stock, label: 'S&P 500 Insurance', curve: 'linear', color: '#9fb3c2', showMark: false, valueFormatter: currencyFormatter },
                                { type: 'line', id: 'sentiment', yAxisKey: 'sentiment', data: data.sentiment, connectNulls: true, color: '#22b8b1', label: `${label} sentiment`, valueFormatter: sentimentFormatter },
                                { type: 'line', id: 'trend', yAxisKey: 'sentiment', data: data.trend, connectNulls: true, showMark: false, color: '#122d42', label: 'Trend', valueFormatter: sentimentFormatter },
                            ]}
                            margin={{ left: isMobile ? 48 : 64, right: isMobile ? 40 : 56, top: 40, bottom: 64 }}
                        >
                            <LinePlot />
                            <MarkPlot />
                            <ChartsXAxis axisId="months" />
                            <ChartsYAxis axisId="stock" position="left" />
                            <ChartsYAxis axisId="sentiment" position="right" />
                            <ChartsLegend direction="row" position={{ vertical: 'top', horizontal: 'middle' }} itemMarkWidth={12} itemMarkHeight={3} labelStyle={{ fontSize: 12 }} />
                            <ChartsTooltip trigger="axis" />
                        </ResponsiveChartContainer>
                    )}
                </Box>
            </Collapse>
        </Card>
    );
}
