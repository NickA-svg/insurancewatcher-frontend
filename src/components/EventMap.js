import React from 'react';
import { Box, Chip, IconButton, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { BORDERS, LAND, MAP_H, MAP_W, PROJ } from './worldMap';

export const HAZARD_STYLE = {
    TC: { color: '#2f6fb3', name: 'Hurricane / typhoon' },
    WS: { color: '#7c5cc4', name: 'Windstorm' },
    EQ: { color: '#b4661f', name: 'Earthquake' },
    FL: { color: '#13998f', name: 'Flood' },
    WF: { color: '#d4452b', name: 'Wildfire' },
    VO: { color: '#6b7280', name: 'Volcano' },
    DR: { color: '#b8920f', name: 'Drought' },
    OT: { color: '#6b7280', name: 'Other' },
};
const style = (h) => HAZARD_STYLE[h] || HAZARD_STYLE.OT;

// Natural Earth 1 projection (same as the outline in worldMap.js).
function project(lat, lon) {
    const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180;
    const p2 = p * p, p4 = p2 * p2;
    const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [PROJ.tx + PROJ.k * x, PROJ.ty - PROJ.k * y];
}

const fmtDate = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const bn = (v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

const FULL = { x: 0, y: 0, w: MAP_W };
const MIN_W = MAP_W / 12; // deepest zoom: 12x
const aspect = MAP_H / MAP_W;
// Contiguous US, fitted with a small margin (the projection curves, so take every corner).
const US_VIEW = (() => {
    const c = [[50, -125], [50, -66], [24, -125], [24, -66], [49, -95], [25, -97]].map(([la, lo]) => project(la, lo));
    const x0 = Math.min(...c.map((p) => p[0])), x1 = Math.max(...c.map((p) => p[0]));
    const y0 = Math.min(...c.map((p) => p[1])), y1 = Math.max(...c.map((p) => p[1]));
    const w = Math.max(x1 - x0, (y1 - y0) / aspect) * 1.08;
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - (w * aspect) / 2, w };
})();

// Choropleth: one hue, light to dark; states with nothing get the land colour.
const RAMP = ['#d7efed', '#a8dbd7', '#6fc0ba', '#35a098', '#137a73'];
const EMPTY = '#e8eef2';
const METRICS = [
    { key: 'events', label: 'Events', unit: (v) => `${v} event${v === 1 ? '' : 's'}` },
    { key: 'headlines', label: 'Headlines', unit: (v) => `${v} headline${v === 1 ? '' : 's'}` },
    { key: 'loss', label: 'Published insured loss', unit: (v) => `US$${bn(v)}bn` },
];

function inRings(x, y, rings) {
    let inside = false;
    for (const r of rings) {
        for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
            const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
    }
    return inside;
}
const ringsPath = (rings) => rings.map((r) => {
    let d = `M${r[0]},${r[1]}`;
    for (let i = 2; i < r.length; i += 2) d += `L${r[i]},${r[i + 1]}`;
    return d + 'Z';
}).join('');

function clampView(v) {
    const w = Math.min(MAP_W, Math.max(MIN_W, v.w));
    const h = w * aspect;
    const x = Math.min(MAP_W - w * 0.5, Math.max(-w * 0.5, v.x));
    const y = Math.min(MAP_H - h * 0.5, Math.max(-h * 0.5, v.y));
    return { x, y, w };
}

/**
 * World map of catastrophe events. Bubble size follows how much market coverage an event drew; colour is the
 * hazard; a dark ring marks red alerts. Positions are approximate (event epicentre or the place most named).
 * Zoom with the buttons, a double click, ctrl/cmd + scroll or a pinch; drag to pan once zoomed in.
 * "US states" fills each state by the events mapped inside it; clicking a state filters to its events.
 */
export default function EventMap({ events, onSelect, selected, height, stateFilter, onStateFilter }) {
    const [hover, setHover] = React.useState(null);
    const [view, setView] = React.useState(FULL);
    const [usMode, setUsMode] = React.useState(false);
    const [states, setStates] = React.useState(null);
    const [metric, setMetric] = React.useState('events');
    const [hoverState, setHoverState] = React.useState(null);
    const svgRef = React.useRef(null);
    const drag = React.useRef(null);
    const pointers = React.useRef(new Map());
    const small = useMediaQuery('(max-width:600px)');
    const grow = small ? 2 : 1; // the map is drawn at a third of its size on phones, so bubbles grow to stay visible
    const scale = MAP_W / view.w;
    const zoomed = scale > 1.05;

    React.useEffect(() => {
        if (usMode && !states) import('./usStates').then((m) => setStates(m.US_STATES.map((s) => ({ ...s, d: ringsPath(s.rings) }))));
    }, [usMode, states]);

    const pts = React.useMemo(() => {
        const withPos = (events || []).filter((e) => e.lat !== null && e.lat !== undefined && e.lon !== null && e.lon !== undefined);
        const maxN = Math.max(1, ...withPos.map((e) => e.article_count || 0));
        return withPos
            .map((e) => {
                const [x, y] = project(e.lat, e.lon);
                const r = grow * (4 + 14 * Math.sqrt((e.article_count || 0) / maxN));
                return { ...e, x, y, r };
            })
            .sort((a, b) => b.r - a.r); // small bubbles drawn last so they stay clickable
    }, [events, grow]);

    // Which state each event sits in, and each state's totals.
    const byState = React.useMemo(() => {
        if (!states) return null;
        const agg = Object.fromEntries(states.map((s) => [s.abbr, { events: 0, headlines: 0, loss: 0, list: [] }]));
        for (const p of pts) {
            const s = states.find((st) => inRings(p.x, p.y, st.rings));
            if (!s) continue;
            const a = agg[s.abbr];
            a.events += 1;
            a.headlines += p.article_count || 0;
            if ((p.est_currency || 'USD') === 'USD' && p.est_high) a.loss += p.est_high;
            a.list.push(p);
        }
        return agg;
    }, [states, pts]);
    const maxMetric = byState ? Math.max(0, ...Object.values(byState).map((a) => a[metric])) : 0;
    const fill = (v) => (!v || !maxMetric ? EMPTY : RAMP[Math.min(RAMP.length - 1, Math.floor((v / maxMetric) * RAMP.length - 1e-9))]);
    const m = METRICS.find((x) => x.key === metric);
    const ranked = byState && states
        ? states.map((s) => ({ ...s, v: byState[s.abbr][metric], n: byState[s.abbr].events })).filter((s) => s.v > 0).sort((a, b) => b.v - a.v)
        : [];

    const shown = stateFilter && byState ? new Set(byState[stateFilter]?.list.map((p) => p.slug)) : null;

    // ---- zoom and pan ----
    const toMap = (clientX, clientY) => {
        const r = svgRef.current.getBoundingClientRect();
        return [view.x + ((clientX - r.left) / r.width) * view.w, view.y + ((clientY - r.top) / r.height) * view.w * aspect];
    };
    const zoomAt = (factor, cx, cy) => setView((v) => {
        const w = Math.min(MAP_W, Math.max(MIN_W, v.w / factor));
        const k = w / v.w;
        return clampView({ x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w });
    });
    const zoomCentre = (factor) => zoomAt(factor, view.x + view.w / 2, view.y + (view.w * aspect) / 2);
    const reset = () => { setView(usMode ? US_VIEW : FULL); };
    const toggleUs = () => {
        const next = !usMode;
        setUsMode(next);
        setView(next ? US_VIEW : FULL);
        if (!next && onStateFilter) onStateFilter(null);
    };
    const pickState = (s) => {
        if (!onStateFilter) return;
        if (stateFilter === s.abbr) { onStateFilter(null); return; }
        onStateFilter({ abbr: s.abbr, name: s.name, slugs: (byState[s.abbr]?.list || []).map((p) => p.slug) });
    };

    React.useEffect(() => {
        const el = svgRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            if (!(e.ctrlKey || e.metaKey)) return; // plain scrolling keeps scrolling the page
            e.preventDefault();
            const [cx, cy] = toMap(e.clientX, e.clientY);
            zoomAt(e.deltaY < 0 ? 1.25 : 0.8, cx, cy);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    });

    const onPointerDown = (e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        drag.current = { x: e.clientX, y: e.clientY, view, moved: false, pinch: null };
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            drag.current.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), view };
        }
    };
    const onPointerMove = (e) => {
        if (!drag.current || !pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const r = svgRef.current.getBoundingClientRect();
        if (drag.current.pinch && pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const v0 = drag.current.pinch.view;
            const midX = v0.x + (((a.x + b.x) / 2 - r.left) / r.width) * v0.w;
            const midY = v0.y + (((a.y + b.y) / 2 - r.top) / r.height) * v0.w * aspect;
            const w = Math.min(MAP_W, Math.max(MIN_W, v0.w * (drag.current.pinch.d / d)));
            const k = w / v0.w;
            setView(clampView({ x: midX - (midX - v0.x) * k, y: midY - (midY - v0.y) * k, w }));
            drag.current.moved = true;
            return;
        }
        const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
        if (!drag.current.moved && Math.hypot(dx, dy) < 4) return;
        if (!zoomed && !usMode) return; // nothing to pan at full size
        drag.current.moved = true;
        if (!svgRef.current.hasPointerCapture(e.pointerId)) svgRef.current.setPointerCapture(e.pointerId);
        const v0 = drag.current.view;
        setView(clampView({ x: v0.x - (dx / r.width) * v0.w, y: v0.y - (dy / r.height) * v0.w * aspect, w: v0.w }));
    };
    const onPointerUp = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size === 0) setTimeout(() => { drag.current = null; }, 0);
    };
    const clicked = (fn) => (e) => { if (drag.current && drag.current.moved) return; fn(e); };

    const vh = view.w * aspect;
    const tipPos = (x, y) => ({ left: `${((x - view.x) / view.w) * 100}%`, top: `${((y - view.y) / vh) * 100}%`,
        transform: `translate(${(x - view.x) / view.w > 0.7 ? '-100%' : '0'}, -110%)` });
    const hazards = [...new Set(pts.map((p) => p.hazard))];
    const btn = { bgcolor: '#fff', border: '1px solid #d5dde3', borderRadius: 1.5, width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 },
        '&:hover': { bgcolor: '#f3f6f8' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.7)' } };

    return (
        <Box>
            <Box sx={{ position: 'relative', width: '100%', maxHeight: height, aspectRatio: `${MAP_W} / ${MAP_H}`, mx: 'auto',
                borderRadius: 1.5, overflow: 'hidden', bgcolor: '#f7fafb' }}>
                <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${vh}`} width="100%" height="100%" role="img"
                    aria-label={`World map of ${pts.length} catastrophe events`}
                    style={{ display: 'block', touchAction: zoomed || usMode ? 'none' : 'pan-y', cursor: zoomed || usMode ? 'grab' : 'default', userSelect: 'none' }}
                    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                    onDoubleClick={(e) => { const [cx, cy] = toMap(e.clientX, e.clientY); zoomAt(2, cx, cy); }}>
                    <path d={LAND} fill="#e8eef2" stroke="none" />
                    <path d={BORDERS} fill="none" stroke="#ffffff" strokeWidth={0.6 / Math.sqrt(scale)} />
                    {usMode && states && byState && states.map((s) => {
                        const a = byState[s.abbr];
                        const on = stateFilter === s.abbr || (hoverState && hoverState.abbr === s.abbr);
                        return (
                            <path key={s.abbr} d={s.d} fill={fill(a[metric])} stroke={on ? '#14212b' : '#ffffff'}
                                strokeWidth={(on ? 1.6 : 0.5) / scale} style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoverState(s)} onMouseLeave={() => setHoverState(null)}
                                onClick={clicked(() => pickState(s))} />
                        );
                    })}
                    {pts.map((p) => {
                        const active = (hover && hover.slug === p.slug) || selected === p.slug;
                        const dim = shown && !shown.has(p.slug);
                        const r = p.r / Math.sqrt(scale) * (usMode ? 0.8 : 1);
                        return (
                            <g key={p.slug} style={{ cursor: 'pointer' }} opacity={dim ? 0.15 : 1}
                                onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}
                                onClick={clicked(() => onSelect && onSelect(p.slug))}>
                                <circle cx={p.x} cy={p.y} r={Math.max(r, 9 / scale)} fill="transparent" />
                                <circle cx={p.x} cy={p.y} r={r} fill={style(p.hazard).color} fillOpacity={active ? 0.9 : usMode ? 0.7 : 0.55}
                                    stroke={p.alert === 'red' ? '#7a1414' : '#ffffff'} strokeWidth={(p.alert === 'red' ? 1.6 : 1) / Math.sqrt(scale)} />
                            </g>
                        );
                    })}
                </svg>
                <Stack direction={{ xs: 'row', sm: 'column' }} spacing={0.75} sx={{ position: 'absolute', right: 8, top: { xs: 'auto', sm: 8 }, bottom: { xs: 8, sm: 'auto' } }}>
                    <Tooltip title="Zoom in" placement="left"><IconButton size="small" sx={btn} onClick={() => zoomCentre(1.6)} disabled={view.w <= MIN_W + 0.01} aria-label="Zoom in"><AddIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Zoom out" placement="left"><IconButton size="small" sx={btn} onClick={() => zoomCentre(1 / 1.6)} disabled={!zoomed} aria-label="Zoom out"><RemoveIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Reset view" placement="left"><IconButton size="small" sx={btn} onClick={reset} aria-label="Reset view"><RestartAltIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
                <Chip label={usMode ? '← World' : 'US states'} size="small" onClick={toggleUs}
                    sx={{ position: 'absolute', left: 8, top: 8, bgcolor: usMode ? '#14212b' : '#fff', color: usMode ? '#fff' : 'inherit',
                        border: '1px solid #d5dde3', fontWeight: 600, '&:hover': { bgcolor: usMode ? '#24394a' : '#f3f6f8' } }} />
                {hover && (
                    <Box sx={{ position: 'absolute', ...tipPos(hover.x, hover.y), pointerEvents: 'none',
                        bgcolor: '#14212b', color: '#fff', px: 1.25, py: 0.75, borderRadius: 1, fontSize: 12, maxWidth: 240, boxShadow: 2, zIndex: 2 }}>
                        <div style={{ fontWeight: 600 }}>{hover.label}</div>
                        <div style={{ opacity: 0.8 }}>{fmtDate(hover.start_date)} · {hover.article_count} headline{hover.article_count === 1 ? '' : 's'}</div>
                    </Box>
                )}
                {!hover && hoverState && byState && (
                    <Box sx={{ position: 'absolute', left: 12, bottom: 12, pointerEvents: 'none', bgcolor: '#14212b', color: '#fff',
                        px: 1.25, py: 0.75, borderRadius: 1, fontSize: 12, boxShadow: 2, zIndex: 2 }}>
                        <div style={{ fontWeight: 600 }}>{hoverState.name}</div>
                        <div style={{ opacity: 0.85 }}>
                            {METRICS.map((x) => x.unit(byState[hoverState.abbr][x.key])).join(' · ')}
                        </div>
                    </Box>
                )}
                {usMode && !states && (
                    <Typography variant="caption" sx={{ position: 'absolute', left: 12, bottom: 10, color: 'text.secondary' }}>Loading states…</Typography>
                )}
            </Box>

            {usMode && (
                <Box sx={{ mt: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>Shade states by</Typography>
                            {METRICS.map((x) => (
                                <Chip key={x.key} size="small" label={x.label} onClick={() => setMetric(x.key)}
                                    color={metric === x.key ? 'secondary' : 'default'} variant={metric === x.key ? 'filled' : 'outlined'} />
                            ))}
                        </Stack>
                        {maxMetric > 0 && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">0</Typography>
                                {RAMP.map((c) => <Box key={c} sx={{ width: 22, height: 10, bgcolor: c }} />)}
                                <Typography variant="caption" color="text.secondary">{m.unit(metric === 'loss' ? maxMetric : Math.round(maxMetric))}</Typography>
                            </Stack>
                        )}
                    </Stack>
                    {ranked.length > 0 && (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>Most affected</Typography>
                            {ranked.slice(0, 8).map((s) => (
                                <Chip key={s.abbr} size="small" variant={stateFilter === s.abbr ? 'filled' : 'outlined'} color={stateFilter === s.abbr ? 'secondary' : 'default'}
                                    label={`${s.name} · ${metric === 'loss' ? m.unit(s.v) : s.v}`}
                                    onClick={() => pickState(s)} />
                            ))}
                        </Stack>
                    )}
                    {byState && ranked.length === 0 && (
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>No US events in this period{metric === 'loss' ? ' with published insured-loss estimates' : ''}.</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                        Each event counts in the state where it is mapped (epicentre or landfall, approximate), so a storm that crossed several states counts once.
                        {metric === 'loss' ? ' Insured loss = the upper end of the latest published industry estimate, US$ events only.' : ''} Click a state to list its events.
                    </Typography>
                </Box>
            )}

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                {hazards.map((h) => (
                    <Stack key={h} direction="row" spacing={0.6} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: style(h).color, opacity: 0.75 }} />
                        <Typography variant="caption" color="text.secondary">{style(h).name}</Typography>
                    </Stack>
                ))}
                <Typography variant="caption" color="text.secondary">· bubble size = market coverage · dark ring = red alert</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" component="div">
                {pts.length} events mapped · approximate locations · {small ? 'use + / − to zoom, drag to pan' : 'double-click or ctrl + scroll to zoom, drag to pan'} · map data: Natural Earth, US Census Bureau
            </Typography>
        </Box>
    );
}
