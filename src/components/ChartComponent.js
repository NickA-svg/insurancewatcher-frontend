import * as React from 'react';
import { ResponsiveChartContainer } from '@mui/x-charts/ResponsiveChartContainer';
import { LinePlot } from '@mui/x-charts/LineChart';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import { Box, Button, Card, CircularProgress, Collapse, Stack, Typography, useMediaQuery } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const TEAL = '#1a9f99';
const TEAL_LIGHT = '#9fd8d4';
const GREY = '#9aa8b3';
const fmt = (v) => (v === null || v === undefined ? '–' : (v > 0 ? '+' : '') + v.toFixed(2));
const monthLabel = (m) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
};

function lastValue(arr) {
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return [arr[i], i];
    return [null, -1];
}

function Headline({ data, label }) {
    const [now, i] = lastValue(data.trend);
    const yearAgo = i >= 12 ? data.trend[i - 12] : null;
    if (now === null) return null;
    const diff = yearAgo === null ? null : now - yearAgo;
    const Icon = diff === null || Math.abs(diff) < 0.02 ? TrendingFlatIcon : diff > 0 ? TrendingUpIcon : TrendingDownIcon;
    const words = diff === null || Math.abs(diff) < 0.02 ? 'about level with' : diff > 0 ? 'more positive than' : 'more negative than';
    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <Icon sx={{ color: 'text.secondary' }} fontSize="small" />
            <Typography variant="body2">
                <b>{fmt(now)}</b> 3-month average for {label.toLowerCase()} news
                {yearAgo !== null && <>, {words} a year ago ({fmt(yearAgo)})</>}.
            </Typography>
        </Stack>
    );
}

export default function SentimentChart({ status, tag, data }) {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [open, setOpen] = React.useState(!isMobile);
    const label = tag === 'All' ? 'Market' : tag;
    const ready = status === 'ready' && data && data.months && data.months.length > 0;

    const series = [];
    if (ready) {
        series.push({ type: 'line', id: 'monthly', data: data.sentiment, label: 'Monthly', color: TEAL_LIGHT, showMark: false, connectNulls: false, valueFormatter: fmt });
        series.push({ type: 'line', id: 'trend', data: data.trend, label: '3-month average', color: TEAL, showMark: false, connectNulls: true, valueFormatter: fmt });
        if (data.market) series.push({ type: 'line', id: 'market', data: data.market, label: 'Whole market (3-month)', color: GREY, showMark: false, connectNulls: true, valueFormatter: fmt });
    }
    const events = ready ? (data.events || []).slice(0, isMobile ? 3 : 6).sort((a, b) => a.month.localeCompare(b.month)) : [];

    return (
        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box>
                    <Typography variant="subtitle1">{label} sentiment index</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Average tone of {label === 'Market' ? 'property, casualty and reinsurance' : label.toLowerCase()} headlines each month, from −1 (negative) to +1 (positive).
                    </Typography>
                </Box>
                <Button size="small" onClick={() => setOpen(!open)} endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ flexShrink: 0 }}>
                    {open ? 'Hide' : 'Show'}
                </Button>
            </Stack>
            {ready && <Headline data={data} label={label} />}
            <Collapse in={open} unmountOnExit>
                <Box sx={{ height: isMobile ? 260 : 320, mt: 1 }}>
                    {status === 'loading' && <div className="loader-div"><CircularProgress color="secondary" /></div>}
                    {status === 'error' && <Typography color="text.secondary" sx={{ p: 3 }}>The chart couldn't load. Please try again shortly.</Typography>}
                    {status === 'ready' && !ready && <Typography color="text.secondary" sx={{ p: 3 }}>Not enough articles to chart this filter yet.</Typography>}
                    {ready && (
                        <ResponsiveChartContainer
                            series={series}
                            xAxis={[{
                                id: 'months', scaleType: 'point', data: data.months, valueFormatter: monthLabel,
                                tickLabelStyle: { fontSize: 11, fill: '#5b6b78' },
                                tickInterval: (value, index) => index % (isMobile ? 6 : 3) === 0,
                            }]}
                            yAxis={[{ id: 'y', tickLabelStyle: { fontSize: 11, fill: '#5b6b78' }, valueFormatter: (v) => (v > 0 ? '+' : '') + v.toFixed(1) }]}
                            margin={{ left: 44, right: 16, top: 28, bottom: 28 }}
                        >
                            <ChartsReferenceLine y={0} lineStyle={{ stroke: '#cfd8de' }} />
                            {events.map((e, i) => {
                                // stagger labels on two rows; labels near the right edge read leftwards so they are not cut off
                                const nearEnd = data.months.indexOf(e.month) > data.months.length * 0.9;
                                const shift = `translate(${nearEnd ? -10 : 0}px, ${i % 2 ? 14 : 0}px)`;
                                return (
                                    <ChartsReferenceLine key={e.month + e.name} x={e.month} label={e.name} labelAlign="start"
                                        lineStyle={{ stroke: '#e0a3a3', strokeDasharray: '3 3' }}
                                        labelStyle={{ fontSize: 10, fill: '#8a4b4b', textAnchor: nearEnd ? 'end' : 'start', transform: shift }} />
                                );
                            })}
                            <LinePlot />
                            <ChartsAxisHighlight x="line" />
                            <ChartsXAxis axisId="months" disableTicks />
                            <ChartsYAxis axisId="y" disableTicks />
                            <ChartsTooltip trigger="axis" />
                        </ResponsiveChartContainer>
                    )}
                </Box>
                {ready && (
                    <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {series.map((s) => (
                            <Stack key={s.id} direction="row" spacing={0.75} alignItems="center">
                                <Box sx={{ width: 16, height: 3, borderRadius: 2, bgcolor: s.color }} />
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </Stack>
                        ))}
                        {events.length > 0 && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <Box sx={{ width: 0, height: 12, borderLeft: '2px dashed #e0a3a3' }} />
                                <Typography variant="caption" color="text.secondary">Major catastrophe events</Typography>
                            </Stack>
                        )}
                    </Stack>
                )}
            </Collapse>
        </Card>
    );
}
