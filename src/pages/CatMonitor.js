import React from 'react';
import { Alert, Box, Button, Card, Chip, CircularProgress, FormControlLabel, InputAdornment, Link, OutlinedInput, Stack, Switch, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LinkIcon from '@mui/icons-material/Link';
import EstimateChart from '../components/EstimateChart';
import EventMap from '../components/EventMap';
import { navigate, setPageMeta } from '../router';
import "../assets/app.css"

const API = process.env.REACT_APP_API_KEY;
const HAZARDS = [["", "All hazards"], ["TC", "Hurricanes & typhoons"], ["EQ", "Earthquakes"], ["FL", "Floods"], ["WF", "Wildfires"], ["WS", "Windstorms"], ["VO", "Volcanoes"]];
const PERIODS = [[90, "90 days"], [365, "12 months"], [0, "All"]];
const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const curSym = (c) => ({ USD: '$', EUR: '€', GBP: '£' }[c] || (c ? c + ' ' : '$'));
const bn = (v) => (v >= 10e9 ? (v / 1e9).toFixed(0) : (v / 1e9).toFixed(1));
const range = (lo, hi, c) => (lo === null || lo === undefined ? null : lo === hi ? `${curSym(c)}${bn(lo)}bn` : `${curSym(c)}${bn(lo)}–${bn(hi)}bn`);

function AlertDot({ alert }) {
    if (!alert) return null;
    const color = alert === 'red' ? '#c62828' : alert === 'orange' ? '#d97706' : '#2e7d32';
    return <Chip size="small" label={`${alert[0].toUpperCase() + alert.slice(1)} alert`} variant="outlined"
        sx={{ color, borderColor: color, height: 22, '& .MuiChip-label': { px: 1 } }} />;
}

function EventDetail({ slug }) {
    const [ev, setEv] = React.useState(null);
    const [err, setErr] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    React.useEffect(() => {
        let cancelled = false;
        fetch(`${API}events/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => { if (!cancelled) setEv(d); }).catch(() => !cancelled && setErr(true));
        return () => { cancelled = true; };
    }, [slug]);
    if (err) return <Alert severity="warning" sx={{ mt: 1 }}>This event couldn't load.</Alert>;
    if (!ev) return <div className="loader-div"><CircularProgress size={26} color="secondary" /></div>;
    const est = ev.estimates || [];
    const named = est.filter((e) => e.estimator).slice(-4);
                const topHigh = named.length ? Math.max(...named.map((e) => e.high)) : 0;
                const latest = named.filter((e) => e.high >= 0.25 * topHigh);
    const lo = latest.length ? Math.min(...latest.map((e) => e.low)) : null;
    const hi = latest.length ? Math.max(...latest.map((e) => e.high)) : null;
    const share = () => {
        const url = `${window.location.origin}/cat-monitor/${ev.slug}/`;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
    };
    return (
        <Box sx={{ mt: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4 }} sx={{ mb: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Dates</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtDate(ev.start_date)}{ev.end_date && ev.end_date !== ev.start_date ? ` – ${fmtDate(ev.end_date)}` : ''}</Typography></Box>
                {ev.severity && <Box><Typography variant="caption" color="text.secondary">Severity</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.severity}</Typography></Box>}
                {lo !== null && <Box><Typography variant="caption" color="text.secondary">Latest industry estimates</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{range(lo, hi, latest[0].currency)}</Typography></Box>}
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<LinkIcon />} onClick={share}>{copied ? 'Link copied' : 'Copy link'}</Button>
            </Stack>
            {est.length > 0 ? (
                <>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Industry insured loss estimates over time</Typography>
                    <Typography variant="caption" color="text.secondary">Each point is a published estimate; bars show stated ranges. Third-party figures, linked to their source.</Typography>
                    <EstimateChart estimates={est} />
                </>
            ) : <Typography variant="body2" color="text.secondary">No industry loss estimates published yet.</Typography>}
            {ev.articles && ev.articles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Market headlines ({ev.article_count})</Typography>
                    {ev.articles.slice(0, 10).map((a) => (
                        <Box key={a.Link} sx={{ py: 0.75, borderBottom: '1px solid #eef2f4' }}>
                            <Link href={a.Link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit" sx={{ fontWeight: 500 }}>{a.Title}</Link>
                            <Typography variant="caption" color="text.secondary" component="div">{new URL(a.Link).hostname.replace('www.', '')} · {fmtDate(a.YearMonthDay)}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
            {ev.source_url && <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>Hazard data: <Link href={ev.source_url} target="_blank" rel="noopener noreferrer">{ev.source_url.includes('usgs') ? 'USGS' : 'GDACS'}</Link></Typography>}
        </Box>
    );
}

function EventRow({ e, open, onToggle }) {
    const est = range(e.est_low, e.est_high, e.est_currency);
    return (
        <div className="event-row" id={`event-${e.slug}`}>
            <Card sx={{ p: { xs: 1.75, sm: 2 }, mb: 1.25 }} onClick={(ev) => { if (!ev.target.closest('a,button')) onToggle(); }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography component="h2" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                                <a href={`/cat-monitor/${e.slug}/`} onClick={(ev) => { ev.preventDefault(); onToggle(); }} style={{ color: 'inherit', textDecoration: 'none' }}>{e.label}</a>
                            </Typography>
                            <AlertDot alert={e.alert} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {fmtDate(e.start_date)}{e.countries ? ` · ${e.countries}` : ''} · {e.article_count} headline{e.article_count === 1 ? '' : 's'}
                            {est && <> · <b style={{ color: '#14212b' }}>{est}</b> latest estimates</>}
                        </Typography>
                    </Box>
                    {open ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
                </Stack>
                {open && <EventDetail slug={e.slug} />}
            </Card>
        </div>
    );
}

export default function CatMonitor({ slug }) {
    const [q, setQ] = React.useState("");
    const [debounced, setDebounced] = React.useState("");
    const [hazard, setHazard] = React.useState("");
    const [withEst, setWithEst] = React.useState(false);
    const [events, setEvents] = React.useState(null);
    const [pinned, setPinned] = React.useState(null);
    const [error, setError] = React.useState(false);
    const [period, setPeriod] = React.useState(365);

    React.useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);
    React.useEffect(() => {
        setPageMeta(pinned ? `${pinned.label}: insured loss estimates & market news · InsuranceWatcher` : "Cat Monitor: catastrophe events, insured loss estimates & market news · InsuranceWatcher",
            "Track global natural catastrophes and the insurance market's response: industry loss estimates over time and linked market headlines.");
    }, [pinned]);
    React.useEffect(() => {
        let cancelled = false;
        setError(false);
        const params = new URLSearchParams({ limit: "150" });
        if (debounced) params.set("q", debounced);
        if (hazard) params.set("hazard", hazard);
        if (withEst) params.set("has_estimates", "true");
        fetch(`${API}events?${params}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => { if (!cancelled) setEvents(d); }).catch(() => !cancelled && setError(true));
        return () => { cancelled = true; };
    }, [debounced, hazard, withEst]);
    React.useEffect(() => {
        if (!slug) { setPinned(null); return; }
        if (events && events.find((e) => e.slug === slug)) { setPinned(events.find((e) => e.slug === slug)); return; }
        fetch(`${API}events/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setPinned(d)).catch(() => {});
    }, [slug, events]);
    React.useEffect(() => {
        if (slug) setTimeout(() => { const el = document.getElementById(`event-${slug}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }, [slug]);

    const toggle = (s) => navigate(slug === s ? '/cat-monitor/' : `/cat-monitor/${s}/`, { replace: true, scroll: false });
    const list = events || [];
    const showPinnedSeparately = pinned && !list.find((e) => e.slug === pinned.slug);
    const cutoff = period ? new Date(Date.now() - period * 864e5).toISOString().slice(0, 10) : '';
    const mapped = list.filter((e) => String(e.start_date).slice(0, 10) >= cutoff);
    const openFromMap = (s) => {
        navigate(`/cat-monitor/${s}/`, { replace: true, scroll: false });
        setTimeout(() => { const el = document.getElementById(`event-${s}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
    };

    return (
        <div className="page">
            <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 1 }}>
                <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>Cat Monitor</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Global catastrophes and the insurance market's response: how industry loss estimates developed, and the headlines that followed.
                </Typography>
            </Box>
            <div className="filters">
                <OutlinedInput fullWidth size="small" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, e.g. Ian, Japan, flood…"
                    inputProps={{ 'aria-label': 'Search events' }} sx={{ bgcolor: '#fff', mb: 1 }}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>} />
                <div className="tag-bar">
                    <div className="tag-group">
                        {HAZARDS.map(([code, lab]) => (
                            <Chip key={code || 'all'} label={lab} size="small" onClick={() => setHazard(code)}
                                color={hazard === code ? 'secondary' : 'default'} variant={hazard === code ? 'filled' : 'outlined'} sx={hazard === code ? {} : { bgcolor: '#fff' }} />
                        ))}
                    </div>
                    <FormControlLabel sx={{ ml: 0.5 }} control={<Switch size="small" checked={withEst} onChange={(e) => setWithEst(e.target.checked)} color="secondary" />}
                        label={<Typography variant="body2">With loss estimates</Typography>} />
                </div>
            </div>
            {events !== null && !error && list.length > 0 && (
                <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="subtitle1">Where events struck</Typography>
                        <Stack direction="row" spacing={0.75}>
                            {PERIODS.map(([d, lab]) => (
                                <Chip key={d} size="small" label={lab} onClick={() => setPeriod(d)}
                                    color={period === d ? 'secondary' : 'default'} variant={period === d ? 'filled' : 'outlined'} />
                            ))}
                        </Stack>
                    </Stack>
                    <EventMap events={mapped} onSelect={openFromMap} selected={slug} />
                </Card>
            )}
            {showPinnedSeparately && <EventRow e={pinned} open onToggle={() => toggle(pinned.slug)} />}
            {error ? <Alert severity="warning">Events couldn't load. Please try again shortly.</Alert>
                : events === null ? <div className="loader-div"><CircularProgress color="secondary" /></div>
                : list.length === 0 ? <Alert severity="info">No events match. Try a broader search.</Alert>
                : list.map((e) => <EventRow key={e.slug} e={e} open={slug === e.slug} onToggle={() => toggle(e.slug)} />)}
        </div>
    );
}
