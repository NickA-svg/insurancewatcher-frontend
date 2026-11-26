import React from 'react';
import { Alert, Box, Card, Chip, CircularProgress, InputAdornment, Link, OutlinedInput, Stack, Typography, useMediaQuery } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { BarChart } from '@mui/x-charts/BarChart';
import { setPageMeta } from '../router';
import "../assets/app.css"

const API = process.env.REACT_APP_API_KEY;
export const KINDS = [
    ["sca", "Filed class actions", "Securities class actions filed in US courts, with class period and lead-plaintiff deadline"],
    ["investigation", "Investigations", "Plaintiff firms investigating possible securities claims: often the step before a filing"],
    ["derivative", "Derivative suits", "Shareholder derivative actions and investigations on behalf of the company against its directors and officers"],
    ["merger", "M&A objections", "Investigations into whether a merger or buyout is fair to shareholders"],
];
const BAR = '#3b6fa8';
const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
const fmtShort = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '');
const daysFrom = (d) => Math.round((new Date(String(d).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5);
const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); };

function Stat({ value, label }) {
    return (
        <Box sx={{ minWidth: 120 }}>
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
    );
}

function CaseRow({ c }) {
    const firms = (c.firms || '').split(', ').filter(Boolean);
    const dl = c.lead_deadline ? daysFrom(c.lead_deadline) : null;
    return (
        <Box sx={{ py: 1.25, borderBottom: '1px solid #eef2f4' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }} alignItems={{ sm: 'baseline' }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                        {c.company || c.ticker}{' '}
                        <Typography component="span" variant="body2" color="text.secondary">{c.exchange ? `${c.exchange}: ` : ''}{c.ticker}</Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {c.sector ? `${c.sector} · ` : ''}
                        {c.class_start ? <>Class period {fmtDate(c.class_start)} – {fmtDate(c.class_end)} · </> : null}
                        first announced {fmtDate(c.first_seen)}
                        {c.share_drop ? <> · share drop {c.share_drop}%</> : null}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                        <Link href={c.latest_link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit" sx={{ fontSize: 13.5 }}>
                            {c.latest_title}
                        </Link>
                    </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0, mt: { xs: 0.5, sm: 0 } }}>
                    {dl !== null && (
                        <Chip size="small" variant="outlined" label={dl >= 0 ? `Lead plaintiff deadline ${fmtDate(c.lead_deadline)}` : `Deadline passed ${fmtShort(c.lead_deadline)}`}
                            sx={dl >= 0 && dl <= 14 ? { borderColor: '#d9822b', color: '#a35b12' } : { bgcolor: '#fff' }} />
                    )}
                    <Chip size="small" label={`${firms.length || 1} firm${firms.length > 1 ? 's' : ''}`} title={firms.join(', ')} />
                </Stack>
            </Stack>
        </Box>
    );
}

export default function Litigation() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [kind, setKind] = React.useState("sca");
    const [q, setQ] = React.useState("");
    const [debounced, setDebounced] = React.useState("");
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        setPageMeta("Securities class action tracker: new D&O lawsuits, lead plaintiff deadlines · InsuranceWatcher",
            "New US securities class actions, shareholder derivative suits and plaintiff-firm investigations as they are announced: class periods, lead-plaintiff deadlines, sectors and share drops.");
    }, []);
    React.useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);
    React.useEffect(() => {
        let cancelled = false;
        setError(false);
        const params = new URLSearchParams({ kind, limit: "200" });
        if (debounced) params.set("q", debounced);
        fetch(`${API}securities-cases?${params}`).then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => { if (!cancelled) setData(d); }).catch(() => !cancelled && setError(true));
        return () => { cancelled = true; };
    }, [kind, debounced]);

    const cases = data ? data.cases : [];
    const monthly = (data ? data.monthly : []).filter((m) => m.kind === kind);
    const months = monthly.map((m) => m.month);
    const upcoming = cases.filter((c) => c.lead_deadline && daysFrom(c.lead_deadline) >= 0)
        .sort((a, b) => String(a.lead_deadline).localeCompare(String(b.lead_deadline)));
    const last30 = cases.filter((c) => daysFrom(c.first_seen) >= -30).length;
    const kindInfo = KINDS.find((k) => k[0] === kind);

    return (
        <div className="page">
            <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 1 }}>
                <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>
                    Securities class action tracker
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    New US securities class actions, derivative suits and plaintiff-firm investigations as they are announced: the D&O claims pipeline in one place.
                </Typography>
            </Box>
            <div className="filters">
                <OutlinedInput fullWidth size="small" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, ticker or sector…"
                    inputProps={{ 'aria-label': 'Search cases' }} sx={{ bgcolor: '#fff', mb: 1 }}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>} />
                <div className="tag-bar">
                    <div className="tag-group">
                        {KINDS.map(([k, lab]) => (
                            <Chip key={k} label={lab} size="small" onClick={() => setKind(k)}
                                color={kind === k ? 'secondary' : 'default'} variant={kind === k ? 'filled' : 'outlined'} sx={kind === k ? {} : { bgcolor: '#fff' }} />
                        ))}
                    </div>
                </div>
            </div>

            {error ? <Alert severity="warning">The tracker couldn't load. Please try again shortly.</Alert>
                : data === null ? <div className="loader-div"><CircularProgress color="secondary" /></div>
                : (
                    <>
                        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{kindInfo[2]}.</Typography>
                            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                                <Stat value={last30} label="new in the last 30 days" />
                                <Stat value={cases.length} label={debounced ? 'matching cases' : 'tracked'} />
                                {kind === 'sca' && <Stat value={upcoming.length} label="open lead-plaintiff deadlines" />}
                            </Stack>
                            {months.length >= 2 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Newly announced per month</Typography>
                                    <Box sx={{ height: isMobile ? 160 : 190 }}>
                                        <BarChart
                                            xAxis={[{ scaleType: 'band', data: months, valueFormatter: monthLabel, tickLabelStyle: { fontSize: 11, fill: '#5b6b78' } }]}
                                            yAxis={[{ tickNumber: 3, tickLabelStyle: { fontSize: 10, fill: '#8796a2' } }]}
                                            series={[{ data: monthly.map((m) => m.n), color: BAR, label: 'Cases' }]}
                                            slotProps={{ legend: { hidden: true } }}
                                            margin={{ left: 36, right: 10, top: 10, bottom: 26 }}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {kind === 'sca' && data.sectors && data.sectors.length > 0 && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Most-sued sectors, last 12 months</Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {data.sectors.map((s) => <Chip key={s.sector} size="small" variant="outlined" label={`${s.sector} · ${s.n}`} onClick={() => setQ(s.sector)} />)}
                                    </Stack>
                                </Box>
                            )}
                            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>
                                Compiled automatically from plaintiff law-firm announcements on public newswires (tracking began November 2026). Allegations only; a filing is not a finding of wrongdoing. Sectors from SEC filings.
                            </Typography>
                        </Card>

                        {kind === 'sca' && upcoming.length > 0 && !debounced && (
                            <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 0.5 }}>Upcoming lead-plaintiff deadlines</Typography>
                                {upcoming.slice(0, 6).map((c) => (
                                    <Typography key={c.case_key} variant="body2" sx={{ py: 0.3 }}>
                                        <b>{fmtDate(c.lead_deadline)}</b> · {c.company || c.ticker} ({c.ticker})
                                        {c.sector ? <Typography component="span" variant="caption" color="text.secondary"> · {c.sector}</Typography> : null}
                                    </Typography>
                                ))}
                            </Card>
                        )}

                        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
                            <Typography variant="subtitle1">{kindInfo[1]}{debounced ? ` matching “${debounced}”` : ''}</Typography>
                            {cases.length === 0
                                ? <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No cases yet. New announcements are picked up every hour.</Typography>
                                : cases.map((c) => <CaseRow key={c.case_key} c={c} />)}
                        </Card>
                    </>
                )}
        </div>
    );
}
