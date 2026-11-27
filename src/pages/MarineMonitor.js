import React from 'react';
import { Alert, Box, Card, Chip, CircularProgress, Collapse, Link, Stack, Typography, useMediaQuery } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { BarChart } from '@mui/x-charts/BarChart';
import MarineMap, { KIND_STYLE } from '../components/MarineMap';
import { setPageMeta } from '../router';
import "../assets/app.css"

const API = process.env.REACT_APP_API_KEY;
const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); };
const ext = { target: '_blank', rel: 'noopener noreferrer' };
const idOf = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return `inc-${(h >>> 0).toString(36)}`; };
const THEME_COLOR = { cover: '#d9822b', traffic: '#3b6fa8', sanctions: '#7c5cc4', security: '#64748b' };

// Which covers each kind of incident tests. General market practice, not policy advice: wordings vary.
const COVER_BY_KIND = {
    attack: ['Hull war', 'Cargo war', 'War P&I & crew'],
    mine: ['Hull war', 'Cargo war', 'War P&I & crew'],
    seizure: ['Blocking & trapping', 'War P&I & crew', 'Loss of hire'],
    piracy: ['Hull war', 'K&R', 'War P&I & crew'],
    gnss: ['Hull & machinery', 'P&I'],
    harassment: ['Hull war (notice)'],
};
const COVERS = [
    { key: 'hull', title: 'Hull war', kinds: ['attack', 'mine', 'piracy'],
        body: 'Ordinary hull policies exclude war, so war damage to the ship is insured separately. Trading into a JWC Listed Area usually needs notice to war underwriters and can cost an additional premium. When the list changes, underwriters give notice of cancellation to apply it, usually 7 days under the standard navigation clause (JW2005/001A).',
        sources: [['Listed Areas & JW2005/001A (The Swedish Club)', 'https://www.swedishclub.com/uploads/2026/07/Listed-Areas-as-per-13-August-2026.pdf'], ['Joint War Committee (LMA)', 'https://lmalloyds.com/committee/joint-war-committee/']] },
    { key: 'cargo', title: 'Cargo war', kinds: ['attack', 'mine'],
        body: 'Cargo war cover generally applies only while goods are on board an ocean-going ship, so cargo held in a port warehouse or on land needs other cover, such as political violence or stock throughput. A damaged ship can also lead to a general average claim that falls on every cargo owner aboard.',
        sources: [] },
    { key: 'pi', title: 'War P&I, crew and kidnap', kinds: ['attack', 'mine', 'seizure', 'piracy'],
        body: 'Most P&I policies need underlying war risks insurance, including a primary layer of war P&I, while a ship is in a listed area. Crew injury, repatriation and, where crews are taken, kidnap and ransom sit here.',
        sources: [['HKSOA circular on JWLA-034', 'https://hksoa.org/?p=9692']] },
    { key: 'trap', title: 'Blocking, trapping and detention', kinds: ['seizure'],
        body: 'War policies can pay a total loss when a ship is seized, detained or trapped for the period the policy sets. Hire lost while waiting is a separate cover (loss of hire), bought by some owners and not others.',
        sources: [['Ships held in the Red Sea and Gulf of Aden (JMIC, Aug 2026)', 'https://www.ukmto.org/-/media/ukmto/products/update-080-jmic-advisory-note-04-august.pdf']] },
    { key: 'delay', title: 'Delay, rerouting and loss of hire', kinds: [], theme: 'traffic',
        body: 'Sailing round the Cape of Good Hope instead of through Suez adds distance, fuel and days at sea. Most of that cost is uninsured: it falls on owners, charterers and cargo interests unless loss of hire or a delay cover was bought.',
        sources: [] },
    { key: 'gnss', title: 'GPS jamming', kinds: ['gnss'],
        body: 'Jamming and spoofing do not damage a ship by themselves. A grounding or collision that follows is normally an ordinary marine claim (hull and P&I), not a war claim, which makes these areas a marine exposure as well as a war one.',
        sources: [] },
    { key: 'sanctions', title: 'Sanctions and the shadow fleet', kinds: [], theme: 'sanctions',
        body: 'Ageing tankers moving sanctioned oil often carry thin or doubtful insurance. A spill or wreck can leave clean-up costs with no solvent insurer behind them, and sanctions clauses can stop legitimate insurers paying claims that touch sanctioned trade.',
        sources: [] },
    { key: 'ports', title: 'Ports, terminals and stock', kinds: [],
        body: 'Strikes on ports, terminals and refineries hit property, political violence and stock throughput policies rather than marine war cover, so a conflict at sea also lands on land-based lines.',
        sources: [] },
];

function Tile({ value, label, sub, color }) {
    return (
        <Card sx={{ p: 2, flex: '1 1 170px', minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1, color }}>{value}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{label}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" component="div">{sub}</Typography>}
        </Card>
    );
}
function Section({ title, help, children, sx, id }) {
    return (
        <Card id={id} sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, ...sx }}>
            <Typography variant="subtitle1">{title}</Typography>
            {help && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>{help}</Typography>}
            {children}
        </Card>
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
function MonthBars({ rows, keys, colors, labels, height, isMobile }) {
    const m = rows.map((r) => r.month);
    return (
        <Box sx={{ height }}>
            <BarChart
                xAxis={[{ scaleType: 'band', data: m, valueFormatter: monthLabel, categoryGapRatio: 0.35,
                    tickLabelStyle: { fontSize: 10, fill: '#5b6b78' }, tickInterval: (v, i) => i % (isMobile ? 3 : 2) === 0 }]}
                yAxis={[{ tickNumber: 3, tickLabelStyle: { fontSize: 10, fill: '#8796a2' } }]}
                series={keys.map((k) => ({ data: rows.map((r) => r[k] || 0), stack: 'a', color: colors[k], label: labels[k] }))}
                slotProps={{ legend: { hidden: true } }}
                margin={{ left: 28, right: 8, top: 10, bottom: 24 }}
            />
        </Box>
    );
}
function Headline({ h, extra }) {
    return (
        <Box sx={{ py: 0.75, borderBottom: '1px solid #eef2f5', '&:last-child': { borderBottom: 0 } }}>
            <Link href={h.link} {...ext} underline="hover" color="inherit" sx={{ fontWeight: 500, fontSize: 14 }}>{h.title}</Link>
            <Typography variant="caption" color="text.secondary" component="div">{fmtDate(h.published)}{extra ? ` · ${extra}` : ''}</Typography>
        </Box>
    );
}

export default function MarineMonitor() {
    const [d, setD] = React.useState(null);
    const [err, setErr] = React.useState(false);
    const [kind, setKind] = React.useState('');
    const [region, setRegion] = React.useState('');
    const [selected, setSelected] = React.useState(null);
    const [theme, setTheme] = React.useState('cover');
    const [openAreas, setOpenAreas] = React.useState(false);
    const [showAll, setShowAll] = React.useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');

    React.useEffect(() => {
        setPageMeta('Marine War Monitor: shipping attacks, JWC Listed Areas & war risk for insurers · InsuranceWatcher',
            'Maritime security incidents, JWC Listed Areas changes, shipping chokepoints and what they mean for hull war, cargo war and war P&I insurance. Every item linked to its source.');
        fetch(`${API}marine`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setErr(true));
    }, []);

    if (err) return <div className="page"><Alert severity="warning" sx={{ mt: 3 }}>The Marine War Monitor couldn't load. Please try again shortly.</Alert></div>;
    if (!d) return <div className="page"><div className="loader-div"><CircularProgress color="secondary" /></div></div>;

    const since = new Date(new Date(d.updated).getTime() - 90 * 864e5).toISOString().slice(0, 10);
    const list = d.incidents.filter((i) => (!kind || i.kind === kind) && (!region || i.region === region));
    const shown = showAll ? list : list.slice(0, 12);
    const kindKeys = d.incident_kinds.filter((k) => k.n365 > 0).map((k) => k.kind);
    const t = d.tiles;
    const onSelect = (link) => {
        setSelected(link); setKind(''); setRegion('');
        setTimeout(() => { const el = document.getElementById(idOf(link)); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    };
    const coverCount = (c) => c.theme ? (d.themes.find((x) => x.key === c.theme) || {}).n90 || 0
        : d.incident_kinds.filter((k) => c.kinds.includes(k.kind)).reduce((s, k) => s + k.n90, 0);

    return (
        <div className="page">
            <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 1.5 }}>
                <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>Marine War Monitor</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    War risk at sea through an insurer's eyes: where ships are being attacked or seized, which waters the London market lists as higher risk,
                    the chokepoints that matter, and which covers each event tests. Every item links to its source.
                </Typography>
            </Box>

            <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, bgcolor: '#f3faf9', borderColor: '#cfe9e6' }}>
                <Typography variant="subtitle1" sx={{ mb: 0.75 }}>What the data says</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                    {d.insights.map((s) => <Typography component="li" variant="body2" key={s} sx={{ mb: 0.5 }}>{s}</Typography>)}
                </Box>
            </Card>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                <Tile value={t.incidents90} label="Incidents reported" sub={`last 90 days · ${t.incidents365} in 12 months`} color="#c0392b" />
                <Tile value={t.headlines90} label="Conflict-zone shipping headlines" sub="last 90 days, from the site's sources" color="#3b6fa8" />
                <Tile value={t.listed_ref} label="Current JWC Listed Areas" sub={`issued ${fmtDate(t.listed_date)}`} color="#d9822b" />
                {t.momentum && <Tile value={`${t.momentum.value > 0 ? '+' : ''}${t.momentum.value}`} label="Marine rate momentum" sub={`${t.momentum.quarter} · ${t.momentum.signals} rate headlines`} color={t.momentum.value > 0 ? '#d9822b' : '#3b82c4'} />}
            </Stack>

            <Section title="War-risk map" help="JWC Listed Areas shaded, the main shipping chokepoints, and maritime security incidents from the headlines. Zoom and drag to explore; click an incident to find it in the tracker.">
                <MarineMap incidents={d.incidents} chokepoints={d.chokepoints} since={since} selected={selected} onSelect={onSelect} />
            </Section>

            <Section title="Chokepoints" help="Where trade squeezes through narrow water. Oil figures show what each normally carries (US EIA); coverage and incidents show where attention is now.">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.25 }}>
                    {d.chokepoints.map((c) => (
                        <Box key={c.key} sx={{ border: '1px solid #e3e8ec', borderRadius: 2, p: 1.5, bgcolor: c.incidents90 ? '#fff7f2' : '#fff' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
                            <Typography variant="caption" color="text.secondary" component="div">
                                ~{c.oil_mbd}m barrels of oil/day ({c.oil_period})
                            </Typography>
                            {c.traffic ? (
                                <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600, color: c.traffic.change_pct <= -30 ? '#c0392b' : 'inherit' }}>
                                    {c.traffic.avg7} transits/day · {c.traffic.change_pct > 0 ? '+' : ''}{c.traffic.change_pct}% vs {c.traffic.baseline_label}
                                </Typography>
                            ) : null}
                            <Typography variant="body2" sx={{ mt: 0.75 }}>
                                <b>{c.news90}</b> headlines in 90 days{c.incidents90 ? <> · <b style={{ color: '#c0392b' }}>{c.incidents90}</b> incidents</> : ''}
                            </Typography>
                            {c.latest && (
                                <Link href={c.latest.link} {...ext} underline="hover" color="text.secondary" sx={{ display: 'block', fontSize: 12.5, mt: 0.5, lineHeight: 1.35 }}>
                                    {c.latest.title} <span style={{ opacity: 0.7 }}>· {fmtDate(c.latest.published)}</span>
                                </Link>
                            )}
                        </Box>
                    ))}
                </Box>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                    Oil flows: <Link href={d.oil_source.url} {...ext}>{d.oil_source.label}</Link> (US government, public domain).
                    {!d.traffic_enabled && ' Daily ship transit counts (IMF PortWatch) will be added once the IMF grants permission for their reuse here.'}
                    {d.traffic_enabled && ' Transits: UN Global Platform; IMF PortWatch (portwatch.imf.org), 7-day average, InsuranceWatcher calculation.'}
                </Typography>
            </Section>

            <Section id="incidents" title="Incident tracker" help="Ships attacked, mined, seized or jammed, as reported in the headlines this site collects. Each links to the original report.">
                {kindKeys.length > 0 && <>
                    <Legend items={kindKeys.map((k) => [KIND_STYLE[k].label, KIND_STYLE[k].color])} />
                    <MonthBars rows={d.monthly} keys={kindKeys} colors={Object.fromEntries(kindKeys.map((k) => [k, KIND_STYLE[k].color]))}
                        labels={Object.fromEntries(kindKeys.map((k) => [k, KIND_STYLE[k].label]))} height={170} isMobile={isMobile} />
                </>}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ my: 1.25 }}>
                    <Chip size="small" label="All types" onClick={() => setKind('')} color={!kind ? 'secondary' : 'default'} variant={!kind ? 'filled' : 'outlined'} />
                    {d.incident_kinds.filter((k) => k.n365).map((k) => (
                        <Chip key={k.kind} size="small" label={`${k.label} · ${k.n365}`} onClick={() => setKind(kind === k.kind ? '' : k.kind)}
                            color={kind === k.kind ? 'secondary' : 'default'} variant={kind === k.kind ? 'filled' : 'outlined'} />
                    ))}
                </Stack>
                {d.regions.length > 1 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>Last 90 days by area</Typography>
                        {d.regions.map((r) => (
                            <Chip key={r.region} size="small" label={`${r.region} · ${r.incidents90}`} onClick={() => setRegion(region === r.region ? '' : r.region)}
                                color={region === r.region ? 'secondary' : 'default'} variant={region === r.region ? 'filled' : 'outlined'} />
                        ))}
                    </Stack>
                )}
                {list.length === 0 ? <Typography variant="body2" color="text.secondary">No incidents match.</Typography> : (
                    <Box>
                        {shown.map((i) => (
                            <Box key={i.link} id={idOf(i.link)} sx={{ py: 1, borderBottom: '1px solid #eef2f5', bgcolor: selected === i.link ? '#fff7e8' : 'transparent', px: selected === i.link ? 1 : 0, borderRadius: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: KIND_STYLE[i.kind].color, mt: '6px', flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Link href={i.link} {...ext} underline="hover" color="inherit" sx={{ fontWeight: 500, fontSize: 14 }}>{i.title}</Link>
                                        <Typography variant="caption" color="text.secondary" component="div">
                                            {fmtDate(i.published)} · {i.kind_label} · {i.region} · {i.vessel} · {i.source}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                            {(COVER_BY_KIND[i.kind] || []).map((c) => <Chip key={c} size="small" label={c} sx={{ height: 20, fontSize: 11, bgcolor: '#f3f6f8' }} />)}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>
                        ))}
                        {list.length > 12 && (
                            <Box sx={{ mt: 1 }}><Chip size="small" icon={showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />} label={showAll ? 'Show fewer' : `Show all ${list.length}`} onClick={() => setShowAll(!showAll)} /></Box>
                        )}
                    </Box>
                )}
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                    Found automatically in headlines from public RSS feeds; a headline that only threatens or forecasts is left out. For official incident reports see{' '}
                    <Link href="https://www.ukmto.org/" {...ext}>UKMTO</Link>.
                </Typography>
            </Section>

            <Section title="JWC Listed Areas" help="The London market's Joint War Committee lists waters where it sees enhanced war, piracy and terrorism risk. Ships going there may need extra war cover; rating is for each underwriter and broker to agree.">
                <Box sx={{ position: 'relative', pl: 2, borderLeft: '2px solid #f0c79c' }}>
                    {d.jwc.changes.map((c) => (
                        <Box key={c.ref} sx={{ mb: 1.5, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', bgcolor: '#d9822b' }} />
                            <Typography variant="body2"><b>{c.ref}</b> <span style={{ color: '#5b6b78' }}>· {fmtDate(c.date)}</span></Typography>
                            <Typography variant="body2">{c.summary}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sources: {c.links.map((l, i) => <React.Fragment key={l.url}>{i ? ', ' : ''}<Link href={l.url} {...ext}>{l.label}</Link></React.Fragment>)}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Chip size="small" sx={{ mt: 0.5 }} icon={openAreas ? <ExpandLessIcon /> : <ExpandMoreIcon />} label={openAreas ? 'Hide the current list' : `See the current list (${d.jwc.current})`} onClick={() => setOpenAreas(!openAreas)} />
                <Collapse in={openAreas}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1.5 }}>
                        {Object.entries(d.jwc.areas).map(([reg, items]) => (
                            <Box key={reg}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{reg}</Typography>
                                {items.map((x) => <Typography key={x} variant="body2" color="text.secondary">{x}</Typography>)}
                            </Box>
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                        Named countries include their ports and waters up to 12 nautical miles offshore unless varied. Summarised from{' '}
                        <Link href={d.jwc.areas_source.url} {...ext}>{d.jwc.areas_source.label}</Link>; the authority is the circular on the{' '}
                        <Link href={d.jwc.page} {...ext}>Joint War Committee page</Link>.
                    </Typography>
                </Collapse>
            </Section>

            <Section title="Which covers respond" help="How each kind of event reaches an insurance policy. An explainer of general market practice, not advice: wordings vary.">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25 }}>
                    {COVERS.map((c) => {
                        const n = coverCount(c);
                        return (
                            <Box key={c.key} sx={{ border: '1px solid #e3e8ec', borderRadius: 2, p: 1.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.title}</Typography>
                                    {(c.kinds.length > 0 || c.theme) && <Typography variant="caption" color={n ? '#c0392b' : 'text.secondary'} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {n} {c.theme ? (n === 1 ? 'headline' : 'headlines') : (n === 1 ? 'incident' : 'incidents')} · 90 days</Typography>}
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{c.body}</Typography>
                                {c.sources.length > 0 && <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                                    Source: {c.sources.map(([l, u], i) => <React.Fragment key={u}>{i ? '; ' : ''}<Link href={u} {...ext}>{l}</Link></React.Fragment>)}</Typography>}
                            </Box>
                        );
                    })}
                </Box>
            </Section>

            <Section title="War cover in the news" help="Conflict-zone shipping headlines by theme, and published moves in war and marine rates. Figures are as the linked report states them.">
                <Legend items={d.themes.map((x) => [`${x.label} · ${x.n90} in 90 days`, THEME_COLOR[x.key]])} />
                <MonthBars rows={d.theme_monthly} keys={d.themes.map((x) => x.key)} colors={THEME_COLOR} labels={Object.fromEntries(d.themes.map((x) => [x.key, x.label]))} height={160} isMobile={isMobile} />
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ my: 1.25 }}>
                    {d.themes.map((x) => <Chip key={x.key} size="small" label={x.label} onClick={() => setTheme(x.key)} color={theme === x.key ? 'secondary' : 'default'} variant={theme === x.key ? 'filled' : 'outlined'} />)}
                </Stack>
                {(d.latest_by_theme[theme] || []).length === 0 ? <Typography variant="body2" color="text.secondary">No recent headlines.</Typography>
                    : d.latest_by_theme[theme].map((h) => <Headline key={h.link} h={h} extra={h.region} />)}
                {d.war_rates.length > 0 && <>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>Published rate moves</Typography>
                    {d.war_rates.map((r) => (
                        <Box key={r.link} sx={{ py: 0.5, display: 'flex', gap: 1, alignItems: 'baseline' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: r.direction > 0 ? '#d9822b' : '#3b82c4', minWidth: 52 }}>
                                {r.pct_high != null ? `${r.direction > 0 ? '+' : '−'}${Math.round(r.pct_high)}%` : r.direction > 0 ? 'up' : 'down'}
                            </Typography>
                            <Link href={r.link} {...ext} underline="hover" color="inherit" sx={{ fontSize: 14 }}>{r.title}</Link>
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{fmtDate(r.published)}</Typography>
                        </Box>
                    ))}
                </>}
            </Section>

            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 3 }}>
                Sources: headlines from public RSS feeds, each linked to its publisher; JWC Listed Areas from the Joint War Committee circulars (LMA/IUA) and the
                summaries linked above; oil flows from the US Energy Information Administration; map outlines from Natural Earth. Incidents, themes and
                cover links are InsuranceWatcher's own classification. Not insurance or legal advice.
            </Typography>
        </div>
    );
}
