import React from 'react';
import { Alert, Box, Card, Chip, CircularProgress, Collapse, Link, Stack, Typography, useMediaQuery } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { BarChart } from '@mui/x-charts/BarChart';
import EstimateChart from '../components/EstimateChart';
import { setPageMeta } from '../router';
import "../assets/app.css"

const API = process.env.REACT_APP_API_KEY;
const C = { ransom: '#c2410c', other: '#94a3b8', sec: '#3b6fa8', up: '#d9822b', down: '#3b82c4', ai: '#7c5cc4' };
const KIND_COLOR = { ransomware: '#c2410c', 'data breach': '#7c5cc4', outage: '#3b6fa8', 'supply chain': '#b4661f', attack: '#64748b' };
const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); };
const curSym = (c) => ({ USD: '$', EUR: '€', GBP: '£' }[c] || (c ? c + ' ' : '$'));
const bn = (v) => (v >= 1e9 ? `${(v / 1e9).toFixed(v >= 10e9 ? 0 : 1)}bn` : `${Math.round(v / 1e6)}m`);
const range = (lo, hi, c) => (lo == null ? null : lo === hi ? `${curSym(c)}${bn(lo)}` : `${curSym(c)}${bn(lo)}–${bn(hi)}`);

function Tile({ value, label, sub, color }) {
    return (
        <Card sx={{ p: 2, flex: '1 1 170px', minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1, color }}>{value}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{label}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" component="div">{sub}</Typography>}
        </Card>
    );
}

function Section({ title, help, children, sx }) {
    return (
        <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, ...sx }}>
            <Typography variant="subtitle1">{title}</Typography>
            {help && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>{help}</Typography>}
            {children}
        </Card>
    );
}

function MonthBars({ months, series, height, isMobile }) {
    const keep = isMobile ? 12 : 24;
    const m = months.slice(-keep);
    return (
        <Box sx={{ height }}>
            <BarChart
                xAxis={[{ scaleType: 'band', data: m, valueFormatter: monthLabel, categoryGapRatio: 0.35,
                    tickLabelStyle: { fontSize: 10, fill: '#5b6b78' }, tickInterval: (v, i) => i % (isMobile ? 3 : 4) === 0 }]}
                yAxis={[{ tickNumber: 3, tickLabelStyle: { fontSize: 10, fill: '#8796a2' } }]}
                series={series.map((s) => ({ ...s, data: s.data.slice(-keep) }))}
                slotProps={{ legend: { hidden: true } }}
                margin={{ left: 32, right: 8, top: 10, bottom: 24 }}
            />
        </Box>
    );
}

function Legend({ items }) {
    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
            {items.map(([label, color]) => (
                <Stack key={label} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Stack>
            ))}
        </Stack>
    );
}

function SystemicCard({ s }) {
    return (
        <Box sx={{ border: '1px solid #e6ecf0', borderRadius: 2, p: 1.5, bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '1.3rem' }}>{s.n90}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
                added in 90 days · {s.n365} in 12 months{s.ransom365 ? ` · ${s.ransom365} used by ransomware` : ''}
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.75, lineHeight: 1.35 }} component="div">{s.note}</Typography>
            <Box sx={{ mt: 1 }}>
                {s.latest.slice(0, 3).map((v) => (
                    <Typography key={v.cve} variant="caption" component="div" sx={{ lineHeight: 1.5 }}>
                        <Link href={`https://nvd.nist.gov/vuln/detail/${v.cve}`} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">
                            {v.product.toLowerCase().startsWith(v.vendor.toLowerCase()) ? v.product : `${v.vendor} ${v.product}`}
                        </Link>
                        <Typography component="span" variant="caption" color="text.secondary"> · {fmtDate(v.date)}</Typography>
                        {v.ransomware && <Typography component="span" variant="caption" sx={{ color: C.ransom, fontWeight: 600 }}> · ransomware</Typography>}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
}

function EventDetail({ slug }) {
    const [ev, setEv] = React.useState(null);
    React.useEffect(() => {
        let cancelled = false;
        fetch(`${API}cyber/events/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null)).then((d) => !cancelled && setEv(d)).catch(() => {});
        return () => { cancelled = true; };
    }, [slug]);
    if (!ev) return <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={22} color="secondary" /></Box>;
    const est = (ev.estimates || []).filter((e) => e.kind === 'industry_insured');
    return (
        <Box sx={{ mt: 1.5 }}>
            {ev.note && <Typography variant="body2" sx={{ mb: 1 }}>{ev.note}</Typography>}
            {est.length > 0 && (
                <>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Industry insured loss estimates over time</Typography>
                    <EstimateChart estimates={est} height={200} />
                    {est.map((e) => (
                        <Typography key={e.link + e.low} variant="caption" component="div">
                            {fmtDate(e.published)} · <b>{range(e.low, e.high, e.currency)}</b> · {e.estimator || 'estimate'} ·{' '}
                            <Link href={e.link} target="_blank" rel="noopener noreferrer">source</Link>
                        </Typography>
                    ))}
                </>
            )}
            {(ev.articles || []).slice(0, 8).map((a) => (
                <Box key={a.Link} sx={{ py: 0.6, borderBottom: '1px solid #eef2f4' }}>
                    <Link href={a.Link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit" sx={{ fontSize: 14, fontWeight: 500 }}>{a.Title}</Link>
                    <Typography variant="caption" color="text.secondary" component="div">{new URL(a.Link).hostname.replace('www.', '')} · {fmtDate(a.YearMonthDay)}</Typography>
                </Box>
            ))}
        </Box>
    );
}

function EventRow({ e, open, onToggle }) {
    const est = range(e.est_low, e.est_high, e.est_currency);
    return (
        <Box sx={{ borderBottom: '1px solid #eef2f4', py: 1.1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} onClick={onToggle} sx={{ cursor: 'pointer' }}>
                <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 1, bgcolor: KIND_COLOR[e.kind] || '#64748b' }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{e.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {e.kind} · {fmtDate(e.start_date)} · {e.article_count} headline{e.article_count === 1 ? '' : 's'}
                    </Typography>
                </Box>
                {est && <Box sx={{ textAlign: 'right' }}><Typography sx={{ fontWeight: 700 }}>{est}</Typography><Typography variant="caption" color="text.secondary">latest insured estimates</Typography></Box>}
                {open ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
            </Stack>
            <Collapse in={open} unmountOnExit><EventDetail slug={e.slug} /></Collapse>
        </Box>
    );
}

export default function CyberMonitor() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [d, setD] = React.useState(null);
    const [error, setError] = React.useState(false);
    const [open, setOpen] = React.useState(null);
    const [allEvents, setAllEvents] = React.useState(false);

    React.useEffect(() => {
        setPageMeta('Cyber Monitor: exploited vulnerabilities, cyber incidents & loss events for insurers · InsuranceWatcher',
            'Cyber aggregation risk for insurers: actively exploited vulnerabilities by systemic category, SEC cyber incident disclosures, cyber loss events with insured estimates, cyber pricing and AI exposure.');
        fetch(`${API}cyber`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setError(true));
    }, []);

    if (error) return <div className="page"><Alert severity="warning" sx={{ mt: 4 }}>The Cyber Monitor couldn't load. Please try again shortly.</Alert></div>;
    if (!d) return <div className="page"><div className="loader-div"><CircularProgress color="secondary" /></div></div>;

    const t = d.tiles;
    const kevDelta = t.kev_prev30 ? Math.round((100 * (t.kev30 - t.kev_prev30)) / t.kev_prev30) : null;
    const otherKev = d.kev_monthly.map((n, i) => n - d.kev_ransom_monthly[i]);
    const systemic = d.systemic.filter((s) => s.key !== 'other' && s.n365 > 0);
    const events = allEvents ? d.events : d.events.slice(0, 8);
    const maxVendor = Math.max(1, ...d.vendors.map((v) => v.n));
    const aiTools = d.systemic.find((s) => s.key === 'ai');

    return (
        <div className="page">
            <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 1 }}>
                <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>Cyber Monitor</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Cyber exposure through an insurer's eyes: which flaws attackers are using right now, where one flaw could hit many insureds at once,
                    which companies are disclosing incidents, and how losses and pricing are moving.
                </Typography>
            </Box>

            {d.insights.length > 0 && (
                <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, bgcolor: '#f3f8f8' }}>
                    <Typography variant="subtitle1" sx={{ mb: 0.5 }}>What the data says</Typography>
                    {d.insights.map((s) => <Typography key={s} variant="body2" sx={{ py: 0.3 }}>• {s}</Typography>)}
                </Card>
            )}

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                <Tile value={t.kev30} label="Newly exploited vulnerabilities" sub={`last 30 days${kevDelta !== null ? ` · ${kevDelta > 0 ? '+' : ''}${kevDelta}% on the previous 30` : ''}`} />
                <Tile value={t.kev_ransom90} label="Linked to ransomware" sub="added in the last 90 days" color={C.ransom} />
                <Tile value={t.sec365} label="Material incidents disclosed" sub={`US-listed companies, 12 months · ${t.sec90} in 90 days`} color={C.sec} />
                {t.momentum && <Tile value={`${t.momentum.value > 0 ? '+' : ''}${t.momentum.value}`} label="Cyber rate momentum" sub={`${t.momentum.quarter} · net share of rate headlines pointing up`} color={t.momentum.value > 0 ? C.up : C.down} />}
            </Stack>

            <Section title="Systemic watch" help="Exploited vulnerabilities grouped by how far one flaw could spread across a portfolio. Counts are vulnerabilities CISA added to its known-exploited list.">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.25 }}>
                    {systemic.map((s) => <SystemicCard key={s.key} s={s} />)}
                </Box>
            </Section>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Section title="Exploitation pressure" help="Vulnerabilities newly confirmed as exploited, per month" sx={{ mb: { xs: 0, md: 2 } }}>
                    <Legend items={[['Used by ransomware', C.ransom], ['Other', C.other]]} />
                    <MonthBars months={d.months} isMobile={isMobile} height={190} series={[
                        { data: d.kev_ransom_monthly, label: 'Used by ransomware', color: C.ransom, stack: 'k' },
                        { data: otherKev, label: 'Other', color: C.other, stack: 'k' }]} />
                </Section>
                <Section title="Incidents disclosed to the SEC" help="Form 8-K Item 1.05 filings (material cybersecurity incidents), per month">
                    <MonthBars months={d.months} isMobile={isMobile} height={190} series={[{ data: d.sec_monthly, label: 'Disclosures', color: C.sec }]} />
                    {d.sec_sectors.length > 0 && (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                            {d.sec_sectors.map((s) => <Chip key={s.sector} size="small" variant="outlined" label={`${s.sector} · ${s.n}`} />)}
                        </Stack>
                    )}
                </Section>
            </Box>

            {d.vendors.length > 0 && (
                <Section title="Most exploited vendors, last 12 months" help="Concentration matters: a vendor that appears again and again is a recurring aggregation point.">
                    {d.vendors.map((v) => (
                        <Stack key={v.vendor} direction="row" alignItems="center" spacing={1} sx={{ py: 0.4 }}>
                            <Typography variant="body2" sx={{ width: { xs: 120, sm: 200 }, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.vendor}</Typography>
                            <Box sx={{ flexGrow: 1, display: 'flex', height: 14 }}>
                                <Box sx={{ width: `${(100 * v.ransomware) / maxVendor}%`, bgcolor: C.ransom, borderRadius: '3px 0 0 3px' }} />
                                <Box sx={{ width: `${(100 * (v.n - v.ransomware)) / maxVendor}%`, bgcolor: C.other, borderRadius: v.ransomware ? '0 3px 3px 0' : '3px' }} />
                            </Box>
                            <Typography variant="body2" sx={{ width: 28, textAlign: 'right', fontWeight: 600 }}>{v.n}</Typography>
                        </Stack>
                    ))}
                </Section>
            )}

            <Section title="Cyber loss events" help="Systemic and high-profile cyber events, the coverage they drew and the industry insured-loss estimates published for them.">
                {d.events.length === 0 ? <Typography variant="body2" color="text.secondary">No events yet.</Typography>
                    : events.map((e) => <EventRow key={e.slug} e={e} open={open === e.slug} onToggle={() => setOpen(open === e.slug ? null : e.slug)} />)}
                {d.events.length > 8 && (
                    <Link component="button" variant="body2" onClick={() => setAllEvents(!allEvents)} sx={{ mt: 1 }}>
                        {allEvents ? 'Show fewer' : `Show all ${d.events.length} events`}
                    </Link>
                )}
            </Section>

            {d.sec_latest.length > 0 && (
                <Section title="Latest cyber incident disclosures" help="US-listed companies reporting a material cybersecurity incident. Updates are follow-up filings on an earlier incident.">
                    <Box sx={{ overflowX: 'auto' }}>
                        <table className="perf-table">
                            <thead><tr><th>Company</th><th>Sector</th><th>Filed</th><th></th></tr></thead>
                            <tbody>
                                {d.sec_latest.slice(0, 12).map((r) => (
                                    <tr key={r.link}>
                                        <td><Link href={r.link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">{r.company}</Link>{r.ticker ? <Typography component="span" variant="caption" color="text.secondary"> {r.ticker}</Typography> : null}</td>
                                        <td>{r.sector}</td>
                                        <td>{fmtDate(r.filed)}</td>
                                        <td>{r.form === '8-K/A' ? <Chip size="small" label="update" /> : null}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </Section>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Section title="Cyber pricing" help="Rate momentum from cyber rate headlines, per quarter (−100 all softening to +100 all hardening)" sx={{ mb: { xs: 0, md: 2 } }}>
                    {d.momentum.length > 0 ? (
                        <Box sx={{ height: 150 }}>
                            <BarChart
                                xAxis={[{ scaleType: 'band', data: d.momentum.map((m) => m.quarter), tickLabelStyle: { fontSize: 10, fill: '#5b6b78' }, categoryGapRatio: 0.4 }]}
                                yAxis={[{ min: -100, max: 100, tickNumber: 3, tickLabelStyle: { fontSize: 10, fill: '#8796a2' } }]}
                                series={[{ data: d.momentum.map((m) => (m.value > 0 ? m.value : null)), color: C.up, stack: 'm', label: 'Hardening' },
                                    { data: d.momentum.map((m) => (m.value < 0 ? m.value : null)), color: C.down, stack: 'm', label: 'Softening' }]}
                                slotProps={{ legend: { hidden: true } }}
                                margin={{ left: 36, right: 8, top: 8, bottom: 24 }}
                            />
                        </Box>
                    ) : <Typography variant="body2" color="text.secondary">Not enough cyber rate headlines yet.</Typography>}
                    {d.pricing.slice(0, 3).map((p) => (
                        <Typography key={p.link} variant="body2" sx={{ py: 0.25 }}>
                            <b style={{ color: p.pct_low > 0 ? C.up : C.down }}>{p.pct_low > 0 ? '+' : ''}{p.pct_low}{p.pct_high !== p.pct_low ? ` to ${p.pct_high}` : ''}%</b>{' '}
                            <Link href={p.link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">{p.title}</Link>
                        </Typography>
                    ))}
                </Section>
                <Section title="AI watch" help="AI in the insurance news, AI tools under attack, and securities suits that mention AI">
                    {aiTools && aiTools.n365 > 0 && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <b style={{ color: C.ai }}>{aiTools.n365}</b> exploited vulnerabilities in AI and machine-learning tools in the last 12 months
                            {aiTools.latest[0] ? `, most recently ${aiTools.latest[0].product} (${fmtDate(aiTools.latest[0].date)})` : ''}.
                        </Typography>
                    )}
                    {d.news_ai_monthly.some((n) => n > 0) && (
                        <>
                            <Typography variant="caption" color="text.secondary">AI headlines per month</Typography>
                            <MonthBars months={d.months} isMobile={isMobile} height={110} series={[{ data: d.news_ai_monthly, label: 'AI headlines', color: C.ai }]} />
                        </>
                    )}
                    {d.ai_latest.slice(0, 4).map((a) => (
                        <Typography key={a.Link} variant="body2" sx={{ py: 0.3 }}>
                            <Link href={a.Link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">{a.Title}</Link>
                            <Typography component="span" variant="caption" color="text.secondary"> · {fmtDate(a.date)}</Typography>
                        </Typography>
                    ))}
                    {d.ai_suits.length > 0 && (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>Securities suits mentioning AI</Typography>
                            {d.ai_suits.slice(0, 4).map((s) => (
                                <Typography key={s.latest_link} variant="body2">{s.company || s.ticker} ({s.ticker}) <Typography component="span" variant="caption" color="text.secondary">· {fmtDate(s.first_seen)}</Typography></Typography>
                            ))}
                        </>
                    )}
                </Section>
            </Box>

            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 3 }}>
                Sources: CISA Known Exploited Vulnerabilities catalogue (US government); SEC EDGAR Form 8-K filings (US government);
                InsuranceWatcher's own headline database. Loss estimates are third-party figures, each linked to its source.
                Vulnerability categories are InsuranceWatcher's grouping.
            </Typography>
        </div>
    );
}
