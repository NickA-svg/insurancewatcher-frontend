import React from 'react';
import { Alert, Box, Card, Chip, CircularProgress, Collapse, InputAdornment, Link, OutlinedInput, Stack, Typography, useMediaQuery } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { setPageMeta } from '../router';
import "../assets/app.css"

const API = process.env.REACT_APP_API_KEY;
const PROFIT = '#1a9f99', LOSS = '#d9822b', MUTED = '#8796a2';
const METRIC = { combined_ratio: 'Combined ratio', loss_ratio: 'Loss ratio', attritional_loss_ratio: 'Attritional loss ratio', gwp: 'Gross written premium' };
const SYM = { USD: '$', GBP: '£', EUR: '€' };
const money = (v, c) => `${SYM[c] || (c ? c + ' ' : '')}${v >= 1e9 ? (v / 1e9).toFixed(1) + 'bn' : Math.round(v / 1e6).toLocaleString('en-GB') + 'm'}`;
const pct = (v) => `${Number(v).toFixed(1)}%`;
const crColor = (v) => (v >= 100 ? LOSS : PROFIT);

function Stat({ value, label, sub }) {
    return (
        <Box sx={{ minWidth: { xs: 0, sm: 130 } }}>
            <Typography sx={{ fontSize: '1.7rem', fontWeight: 700, lineHeight: 1.1 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" component="div">{label}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" component="div">{sub}</Typography>}
        </Box>
    );
}

// Tiny trend line of combined ratios with a dashed 100% breakeven line.
function Spark({ points }) {
    if (!points || points.length < 2) return <Box sx={{ width: 90 }} />;
    const vals = points.map((p) => p.value);
    const lo = Math.min(80, ...vals) - 3, hi = Math.max(105, ...vals) + 3;
    const W = 90, H = 26, x = (i) => (i / (points.length - 1)) * (W - 4) + 2, y = (v) => H - 2 - ((v - lo) / (hi - lo)) * (H - 4);
    return (
        <svg width={W} height={H} role="img" aria-label={`Combined ratio trend: ${points.map((p) => `${p.label} ${p.value}%`).join(', ')}`}>
            <line x1="0" x2={W} y1={y(100)} y2={y(100)} stroke="#d5dde3" strokeDasharray="3 3" />
            <polyline fill="none" stroke={MUTED} strokeWidth="2" points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} />
            <circle cx={x(points.length - 1)} cy={y(vals[vals.length - 1])} r="3" fill={crColor(vals[vals.length - 1])} />
        </svg>
    );
}

function LloydsCard({ data, isMobile }) {
    const fy = data.results.filter((r) => r.period === 'FY');
    const latest = data.results[data.results.length - 1];
    const lastFy = fy[fy.length - 1];
    const g = data.guidance;
    return (
        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
            <Typography variant="subtitle1">Lloyd's market</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>As published by Lloyd's. Below 100% is an underwriting profit.</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, auto)' }, gap: { xs: 1.5, sm: 3 }, justifyContent: 'start' }}>
                <Stat value={pct(latest.combined_ratio)} label={`Combined ratio, ${latest.period} ${latest.year}`} />
                {latest.underlying_combined_ratio && <Stat value={pct(latest.underlying_combined_ratio)} label="Underlying (excl. major claims)" />}
                <Stat value={`£${latest.gwp_bn}bn`} label={`Gross written premium, ${latest.period} ${latest.year}`} />
                <Stat value={pct(lastFy.combined_ratio)} label={`Full year ${lastFy.year}`} sub={`£${lastFy.gwp_bn}bn premium`} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>Full-year combined ratio</Typography>
            <Box sx={{ height: isMobile ? 170 : 200 }}>
                <BarChart
                    xAxis={[{ scaleType: 'band', data: fy.map((r) => String(r.year)), tickLabelStyle: { fontSize: 11, fill: '#5b6b78' }, categoryGapRatio: 0.45 }]}
                    yAxis={[{ min: 60, max: 115, tickNumber: 4, tickLabelStyle: { fontSize: 10, fill: MUTED }, valueFormatter: (v) => `${v}%` }]}
                    series={[
                        { data: fy.map((r) => (r.combined_ratio < 100 ? r.combined_ratio : null)), label: 'Underwriting profit', color: PROFIT, stack: 'cr', valueFormatter: (v) => (v === null ? '' : `${v}%`) },
                        { data: fy.map((r) => (r.combined_ratio >= 100 ? r.combined_ratio : null)), label: 'Underwriting loss', color: LOSS, stack: 'cr', valueFormatter: (v) => (v === null ? '' : `${v}%`) },
                    ]}
                    slotProps={{ legend: { hidden: true } }}
                    margin={{ left: 40, right: 10, top: 10, bottom: 26 }}
                >
                    <ChartsReferenceLine y={100} lineStyle={{ stroke: '#9aa8b3', strokeDasharray: '4 3' }} />
                </BarChart>
            </Box>
            {g && (
                <Typography variant="body2" color="text.secondary">
                    Lloyd's guidance for {g.year}: £{g.gwp_bn}bn premium and a combined ratio of {g.combined_ratio_low}–{g.combined_ratio_high}%.{' '}
                    <Link href={data.source} target="_blank" rel="noopener noreferrer">Lloyd's results</Link>
                </Typography>
            )}
        </Card>
    );
}

function CompanyDetail({ name }) {
    const [d, setD] = React.useState(null);
    React.useEffect(() => {
        let cancelled = false;
        fetch(`${API}performance/${encodeURIComponent(name)}`).then((r) => (r.ok ? r.json() : null)).then((x) => !cancelled && setD(x)).catch(() => {});
        return () => { cancelled = true; };
    }, [name]);
    if (!d) return <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={22} color="secondary" /></Box>;
    const rows = [...d.figures].reverse();
    return (
        <Box sx={{ mt: 1.5, overflowX: 'auto' }}>
            <table className="perf-table">
                <thead><tr><th>Period</th><th>Figure</th><th>Value</th><th>Source</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={`${r.period}${r.year}${r.segment}${r.metric}`}>
                            <td>{r.period} {r.year}</td>
                            <td>{METRIC[r.metric]}{r.segment ? ` (${r.segment})` : ''}</td>
                            <td style={{ fontWeight: 600 }}>{r.metric === 'gwp' ? money(r.value, r.currency) : pct(r.value)}</td>
                            <td><Link href={r.link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">{r.title}</Link></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
}

function CompanyRow({ c, open, onToggle }) {
    const delta = c.prior ? c.latest.value - c.prior.value : null;
    return (
        <Box sx={{ borderBottom: '1px solid #eef2f4', py: 1.1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} onClick={onToggle} sx={{ cursor: 'pointer' }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{c.company}{c.segment ? <Typography component="span" variant="body2" color="text.secondary"> · {c.segment}</Typography> : null}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.group}{c.gwp ? ` · GWP ${money(c.gwp.value, c.gwp.currency)} (${c.gwp.label})` : ''}</Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Spark points={c.history} /></Box>
                <Box sx={{ width: { xs: 86, sm: 120 }, textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 700, color: crColor(c.latest.value) }}>{pct(c.latest.value)}</Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                        {c.latest.label}
                        {delta !== null && <span style={{ color: delta > 0 ? LOSS : PROFIT }}>{` · ${delta > 0 ? '+' : ''}${delta.toFixed(1)} pts`}</span>}
                    </Typography>
                </Box>
                {open ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
            </Stack>
            <Collapse in={open} unmountOnExit><CompanyDetail name={c.company} /></Collapse>
        </Box>
    );
}

export default function Performance() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(false);
    const [group, setGroup] = React.useState('');
    const [q, setQ] = React.useState('');
    const [open, setOpen] = React.useState(null);

    React.useEffect(() => {
        setPageMeta("Insurance market performance: Lloyd's and re/insurer combined ratios · InsuranceWatcher",
            "Lloyd's market results and reported combined ratios, loss ratios and premiums for listed insurers and reinsurers, each linked to its source.");
        fetch(`${API}performance`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
    }, []);

    const companies = data ? data.companies : [];
    const groups = [...new Set(companies.map((c) => c.group).filter(Boolean))].sort();
    const shown = companies.filter((c) => (!group || c.group === group) && (!q || c.company.toLowerCase().includes(q.toLowerCase())));

    return (
        <div className="page">
            <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 1 }}>
                <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>Market performance</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Lloyd's market results and the combined ratios re/insurers report, collected from published results and linked to their source.
                </Typography>
            </Box>
            {error ? <Alert severity="warning">Market performance couldn't load. Please try again shortly.</Alert>
                : data === null ? <div className="loader-div"><CircularProgress color="secondary" /></div>
                : (
                    <>
                        <LloydsCard data={data.lloyds} isMobile={isMobile} />
                        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
                            <Typography variant="subtitle1">Reported combined ratios</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                                Latest figure each company reported, with the change on the same period a year earlier. Click a company for every figure and its source.
                            </Typography>
                            <OutlinedInput fullWidth size="small" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a company…"
                                inputProps={{ 'aria-label': 'Find a company' }} sx={{ bgcolor: '#fff', mb: 1 }}
                                startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>} />
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                {['', ...groups].map((g) => (
                                    <Chip key={g || 'all'} size="small" label={g || 'All'} onClick={() => setGroup(g)}
                                        color={group === g ? 'secondary' : 'default'} variant={group === g ? 'filled' : 'outlined'} />
                                ))}
                            </Stack>
                            {shown.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No companies match.</Typography>
                                : shown.map((c) => <CompanyRow key={c.company} c={c} open={open === c.company} onToggle={() => setOpen(open === c.company ? null : c.company)} />)}
                            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>
                                Figures as reported in results headlines; company-defined, so not always like for like (group vs segment, net vs gross, discounting).
                                Orange marks an underwriting loss (above 100%). Spotted an error? <Link href="mailto:insurancewatcher@outlook.com?subject=Market%20performance%20correction">Tell us</Link>.
                            </Typography>
                        </Card>
                        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, bgcolor: '#f3f8f8' }}>
                            <Typography variant="subtitle1">Want the full dataset?</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Peer comparisons, downloadable history and alerts when a company reports are in the works.{' '}
                                <Link href="mailto:insurancewatcher@outlook.com?subject=Market%20performance%20data">Register your interest</Link> and tell us what you'd use it for.
                            </Typography>
                        </Card>
                    </>
                )}
        </div>
    );
}
