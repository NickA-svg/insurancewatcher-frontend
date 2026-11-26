import * as React from 'react';
import { ResponsiveChartContainer } from '@mui/x-charts/ResponsiveChartContainer';
import { LinePlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import { Box, Button, Card, Chip, CircularProgress, Collapse, Link, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const C = {
    sentimentLight: '#9fd8d4', sentiment: '#1a9f99', market: '#9aa8b3',
    harden: '#d9822b', soften: '#3b82c4',
    us: '#2563eb', uk: '#7c3aed', event: '#e0a3a3', eventText: '#8a4b4b',
};
const MARGIN = { left: 44, right: 16, top: 10, bottom: 6 };
const fmt2 = (v) => (v === null || v === undefined ? '–' : (v > 0 ? '+' : '') + v.toFixed(2));
const fmtPct = (v) => (v === null || v === undefined ? '–' : v.toFixed(1) + '%');
const fmtMom = (v) => (v === null || v === undefined ? '–' : (v > 0 ? '+' : '') + Math.round(v));
const monthLabel = (m) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
};
const quarterOf = (m) => { const [y, mo] = m.split('-').map(Number); return `${y} Q${Math.floor((mo - 1) / 3) + 1}`; };

function lastValue(arr) {
    for (let i = (arr || []).length - 1; i >= 0; i--) if (arr[i] !== null && arr[i] !== undefined) return [arr[i], i];
    return [null, -1];
}

function Summary({ data, label }) {
    const [s, i] = lastValue(data.trend);
    const sYear = i >= 12 ? data.trend[i - 12] : null;
    const [m, j] = lastValue(data.momentum);
    const mYear = j >= 12 ? data.momentum[j - 12] : null;
    const lines = [];
    if (s !== null) {
        const d = sYear === null ? null : s - sYear;
        lines.push(<>News tone for {label.toLowerCase()} is <b>{fmt2(s)}</b> (3-month average){d !== null && <>, {Math.abs(d) < 0.02 ? 'about level with' : d > 0 ? 'more positive than' : 'more negative than'} a year ago ({fmt2(sYear)})</>}.</>);
    }
    if (m !== null) {
        const q = quarterOf(data.months[j]);
        const word = m >= 50 ? 'most rate headlines point to increases' : m > 0 ? 'rate headlines lean towards increases' : m === 0 ? 'rate headlines are split' : m > -50 ? 'rate headlines lean towards decreases' : 'most rate headlines point to decreases';
        lines.push(<>Rate momentum <b>{fmtMom(m)}</b> in {q}: {word}{mYear !== null && <> (a year earlier: {fmtMom(mYear)})</>}.</>);
    }
    if (!lines.length) return null;
    return (
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {lines.map((l, k) => <Typography key={k} variant="body2">{l}</Typography>)}
        </Stack>
    );
}

function Legend({ items }) {
    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 0.5, mb: 0.5 }}>
            {items.map((it) => (
                <Stack key={it.label} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={it.bar
                        ? { width: 10, height: 10, borderRadius: '2px', bgcolor: it.color }
                        : { width: 16, height: 0, borderTop: `${it.dashed ? '2px dashed' : '3px solid'} ${it.color}`, borderRadius: 2 }} />
                    <Typography variant="caption" color="text.secondary">{it.label}</Typography>
                </Stack>
            ))}
        </Stack>
    );
}

function PanelTitle({ title, help }) {
    return (
        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
            {help && <Typography variant="caption" color="text.secondary">{help}</Typography>}
        </Stack>
    );
}

function Panel({ months, series, height, yFormat, events, labelled, showX, sx, isMobile, yMin, yMax }) {
    return (
        <Box sx={{ height }}>
            <ResponsiveChartContainer
                series={series}
                xAxis={[{ id: 'm', scaleType: 'band', data: months, valueFormatter: monthLabel,
                    tickLabelStyle: { fontSize: 11, fill: '#5b6b78' },
                    tickInterval: (v, i) => i % (isMobile ? 6 : 3) === 0 }]}
                yAxis={[{ id: 'y', min: yMin, max: yMax, tickNumber: 3, tickLabelStyle: { fontSize: 10, fill: '#8796a2' }, valueFormatter: yFormat }]}
                margin={{ ...MARGIN, top: labelled ? 34 : MARGIN.top, bottom: showX ? 26 : MARGIN.bottom }}
                sx={sx}
            >
                <ChartsReferenceLine y={0} lineStyle={{ stroke: '#d5dde3' }} />
                {events.map((e, i) => (
                    <ChartsReferenceLine key={e.month + e.label} x={e.month}
                        label={labelled ? e.label : undefined} labelAlign="start"
                        lineStyle={{ stroke: C.event, strokeDasharray: '3 3' }}
                        labelStyle={{ fontSize: 10, fill: C.eventText,
                            textAnchor: months.indexOf(e.month) > months.length * 0.85 ? 'end' : 'start',
                            transform: `translate(${months.indexOf(e.month) > months.length * 0.85 ? -6 : 0}px, ${i % 2 ? -12 : -24}px)` }} />
                ))}
                <BarPlot />
                <LinePlot />
                <ChartsAxisHighlight x="line" />
                {showX ? <ChartsXAxis axisId="m" disableTicks /> : null}
                <ChartsYAxis axisId="y" disableTicks />
                <ChartsTooltip trigger="axis" />
            </ResponsiveChartContainer>
        </Box>
    );
}

export default function MarketCycle({ status, tag, data, onEventClick }) {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [open, setOpen] = React.useState(!isMobile);
    const label = tag === 'All' ? 'the market' : tag;
    const ready = status === 'ready' && data && data.months && data.months.length > 0;

    let months = [], top = [], panels = [];
    if (ready) {
        months = data.months;
        const maxLabels = isMobile ? 3 : 6;
        top = [...data.events].sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, maxLabels)
            .sort((a, b) => a.date.localeCompare(b.date));
        const sentSeries = [
            { type: 'line', id: 'monthly', data: data.sentiment, label: 'Monthly', color: C.sentimentLight, showMark: false, valueFormatter: fmt2 },
            { type: 'line', id: 'trend', data: data.trend, label: '3-month average', color: C.sentiment, showMark: false, connectNulls: true, valueFormatter: fmt2 },
        ];
        if (data.market) sentSeries.push({ type: 'line', id: 'market', data: data.market, label: 'Whole market', color: C.market, showMark: false, connectNulls: true, valueFormatter: fmt2 });
        panels.push({ key: 'sent', title: 'News sentiment', help: '−1 negative to +1 positive', series: sentSeries, height: isMobile ? 170 : 190, yFormat: (v) => (v > 0 ? '+' : '') + v.toFixed(1),
            legend: sentSeries.map((s) => ({ label: s.label, color: s.color })) });

        if (data.momentum && data.momentum.some((v) => v !== null)) {
            const up = data.momentum.map((v) => (v !== null && v > 0 ? v : null));
            const down = data.momentum.map((v) => (v !== null && v < 0 ? v : null));
            panels.push({ key: 'mom', title: 'Rate momentum', help: 'net share of rate headlines pointing up, per quarter (−100 to +100)',
                series: [
                    { type: 'bar', id: 'up', data: up, label: 'Hardening', color: C.harden, stack: 'm', valueFormatter: fmtMom },
                    { type: 'bar', id: 'down', data: down, label: 'Softening', color: C.soften, stack: 'm', valueFormatter: fmtMom },
                ], height: isMobile ? 120 : 140, yFormat: (v) => Math.round(v), yMin: -100, yMax: 100,
                legend: [{ label: 'Rates hardening', color: C.harden, bar: true }, { label: 'Rates softening', color: C.soften, bar: true }] });
        }

        const mac = data.macro || {};
        const macroSeries = [
            ['us_cpi', 'US inflation', C.us, false], ['uk_cpi', 'UK inflation', C.uk, false],
            ['fed_funds', 'US Fed funds rate', C.us, true], ['boe_rate', 'Bank of England rate', C.uk, true],
        ].filter(([k]) => mac[k] && mac[k].some((v) => v !== null))
            .map(([k, l, c, d]) => ({ type: 'line', id: k, data: mac[k], label: l, color: c, showMark: false, connectNulls: true, valueFormatter: fmtPct, dashed: d }));
        if (macroSeries.length) {
            panels.push({ key: 'macro', title: 'Inflation & interest rates', help: 'claims inflation and investment-income backdrop', series: macroSeries,
                height: isMobile ? 140 : 160, yFormat: (v) => v.toFixed(0) + '%',
                sx: Object.fromEntries(macroSeries.filter((s) => s.dashed).map((s) => [`& .MuiLineElement-series-${s.id}`, { strokeDasharray: '5 4' }])),
                legend: macroSeries.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed })) });
        }
    }

    return (
        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box>
                    <Typography variant="subtitle1">Market cycle: {tag === 'All' ? 'all lines' : tag}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        News tone, rate direction and the economic backdrop on one timeline, with the events that moved the market.
                    </Typography>
                </Box>
                <Button size="small" onClick={() => setOpen(!open)} endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />} sx={{ flexShrink: 0 }}>
                    {open ? 'Hide' : 'Show'}
                </Button>
            </Stack>
            {ready && <Summary data={data} label={label} />}
            <Collapse in={open} unmountOnExit>
                {status === 'loading' && <div className="loader-div"><CircularProgress color="secondary" /></div>}
                {status === 'error' && <Typography color="text.secondary" sx={{ p: 3 }}>The market panel couldn't load. Please try again shortly.</Typography>}
                {status === 'ready' && !ready && <Typography color="text.secondary" sx={{ p: 3 }}>Not enough articles to chart this filter yet.</Typography>}
                {ready && panels.map((p, idx) => (
                    <Box key={p.key}>
                        <PanelTitle title={p.title} help={p.help} />
                        <Legend items={p.legend} />
                        <Panel months={months} series={p.series} height={p.height} yFormat={p.yFormat} yMin={p.yMin} yMax={p.yMax}
                            events={top} labelled={idx === 0} showX={idx === panels.length - 1} sx={p.sx} isMobile={isMobile} />
                    </Box>
                ))}
                {ready && data.events.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>Market-moving events{tag !== 'All' ? ` for ${tag}` : ''}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {[...data.events].reverse().map((e) => (
                                <Tooltip key={e.date + e.label} title={e.note || ''} disableHoverListener={!e.note}>
                                    <Chip size="small" variant="outlined" clickable onClick={() => onEventClick && onEventClick(e)}
                                        label={`${e.label} · ${new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                                        sx={{ borderColor: e.kind === 'man-made' ? '#c9b6e4' : '#efc9c9', bgcolor: '#fff' }} />
                                </Tooltip>
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">Pink = natural catastrophe, lilac = man-made. Click an event to see its headlines.</Typography>
                    </Box>
                )}
                {ready && data.signals && data.signals.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Latest rate signals</Typography>
                        {data.signals.slice(0, 4).map((s) => (
                            <Typography key={s.link} variant="body2" sx={{ py: 0.25 }}>
                                <b style={{ color: s.low > 0 ? C.harden : C.soften }}>{s.low === s.high ? `${s.low > 0 ? '+' : ''}${s.low}%` : `${s.low > 0 ? '+' : ''}${s.low} to ${s.high}%`}</b>{' '}
                                <Link href={s.link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">{s.title}</Link>
                                <Typography component="span" variant="caption" color="text.secondary"> · {new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</Typography>
                            </Typography>
                        ))}
                    </Box>
                )}
            </Collapse>
        </Card>
    );
}
