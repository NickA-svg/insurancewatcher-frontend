import React from 'react';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { BORDERS, LAND, MAP_H, MAP_W, PROJ } from './worldMap';
import { JWC_COUNTRIES, JWC_WATERS } from './jwcAreas';

export const KIND_STYLE = {
    attack: { color: '#c0392b', label: 'Attack / strike' },
    mine: { color: '#8e44ad', label: 'Mine' },
    seizure: { color: '#d97706', label: 'Seizure / detention' },
    piracy: { color: '#2c3e50', label: 'Piracy / hijack' },
    gnss: { color: '#2f6fb3', label: 'GPS jamming' },
    harassment: { color: '#6b7280', label: 'Harassment' },
};
const LISTED = '#f0a35b';

function project(lat, lon) {
    const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180, p2 = p * p, p4 = p2 * p2;
    const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [PROJ.tx + PROJ.k * x, PROJ.ty - PROJ.k * y];
}
const ringsPath = (rings) => rings.map((r) => { let d = `M${r[0]},${r[1]}`; for (let i = 2; i < r.length; i += 2) d += `L${r[i]},${r[i + 1]}`; return d + 'Z'; }).join('');
const COUNTRY_PATHS = JWC_COUNTRIES.map((c) => ({ name: c.name, d: ringsPath(c.rings) }));
const WATER_PATHS = JWC_WATERS.map((w) => ({ name: w.name, d: ringsPath(w.rings) }));
const aspect = 0.62; // taller than the world outline, to fit Europe, Africa and the Gulf
const MIN_W = MAP_W / 14;
// Default view: the Atlantic edge of Africa to the Arabian Sea, the Cape to the Baltic.
const HOME = (() => {
    const c = [[58, -20], [58, 75], [-36, -20], [-36, 75], [60, 30]].map(([la, lo]) => project(la, lo));
    const x0 = Math.min(...c.map((p) => p[0])), x1 = Math.max(...c.map((p) => p[0]));
    const y0 = Math.min(...c.map((p) => p[1])), y1 = Math.max(...c.map((p) => p[1]));
    const w = Math.max(x1 - x0, (y1 - y0) / aspect);
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - (w * aspect) / 2, w };
})();
const clamp = (v) => {
    const w = Math.min(MAP_W, Math.max(MIN_W, v.w)), h = w * aspect;
    return { x: Math.min(MAP_W - w * 0.4, Math.max(-w * 0.6, v.x)), y: Math.min(MAP_H - h * 0.4, Math.max(-h * 0.6, v.y)), w };
};
const fmtDate = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * War-risk map: JWC Listed Areas shaded, chokepoints sized by the oil they normally carry, and incidents from headlines.
 * Zoom with the buttons, a double click, ctrl/cmd + scroll or a pinch; drag to pan.
 */
export default function MarineMap({ incidents, chokepoints, since, selected, onSelect }) {
    const [view, setView] = React.useState(HOME);
    const [layers, setLayers] = React.useState({ listed: true, choke: true, incidents: true });
    const [hover, setHover] = React.useState(null);
    const svgRef = React.useRef(null);
    const drag = React.useRef(null);
    const pointers = React.useRef(new Map());
    const scale = MAP_W / view.w;
    const vh = view.w * aspect;

    const pts = React.useMemo(() => {
        const seen = {};
        return (incidents || []).filter((i) => i.lat != null).map((i) => {
            // incidents share a region's centre point, so fan them out a little
            const k = `${i.lat},${i.lon}`; const n = (seen[k] = (seen[k] || 0) + 1) - 1;
            const ang = n * 2.4, rad = n ? 0.9 + 0.55 * Math.sqrt(n) : 0;
            const [x, y] = project(i.lat + rad * Math.sin(ang), i.lon + rad * Math.cos(ang));
            return { ...i, x, y, recent: i.published >= since };
        }).sort((a, b) => (a.recent === b.recent ? 0 : a.recent ? 1 : -1));
    }, [incidents, since]);
    const cps = React.useMemo(() => {
        const maxOil = Math.max(1, ...(chokepoints || []).map((c) => c.oil_mbd || 0));
        return (chokepoints || []).map((c) => { const [x, y] = project(c.lat, c.lon); return { ...c, x, y, r: 5 + 9 * Math.sqrt((c.oil_mbd || 0) / maxOil) }; });
    }, [chokepoints]);

    const toMap = (cx, cy) => { const r = svgRef.current.getBoundingClientRect(); return [view.x + ((cx - r.left) / r.width) * view.w, view.y + ((cy - r.top) / r.height) * vh]; };
    const zoomAt = (f, cx, cy) => setView((v) => { const w = Math.min(MAP_W, Math.max(MIN_W, v.w / f)); const k = w / v.w; return clamp({ x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w }); });
    const zoomCentre = (f) => zoomAt(f, view.x + view.w / 2, view.y + vh / 2);
    React.useEffect(() => {
        const el = svgRef.current; if (!el) return undefined;
        const onWheel = (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const [cx, cy] = toMap(e.clientX, e.clientY); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, cx, cy); };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    });
    const down = (e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        drag.current = { x: e.clientX, y: e.clientY, view, moved: false, pinch: null };
        if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; drag.current.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), view }; }
    };
    const move = (e) => {
        if (!drag.current || !pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const r = svgRef.current.getBoundingClientRect();
        if (drag.current.pinch && pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()], v0 = drag.current.pinch.view;
            const mx = v0.x + (((a.x + b.x) / 2 - r.left) / r.width) * v0.w, my = v0.y + (((a.y + b.y) / 2 - r.top) / r.height) * v0.w * aspect;
            const w = Math.min(MAP_W, Math.max(MIN_W, v0.w * (drag.current.pinch.d / Math.hypot(a.x - b.x, a.y - b.y)))), k = w / v0.w;
            setView(clamp({ x: mx - (mx - v0.x) * k, y: my - (my - v0.y) * k, w })); drag.current.moved = true; return;
        }
        const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
        if (!drag.current.moved && Math.hypot(dx, dy) < 4) return;
        drag.current.moved = true;
        if (!svgRef.current.hasPointerCapture(e.pointerId)) svgRef.current.setPointerCapture(e.pointerId);
        const v0 = drag.current.view;
        setView(clamp({ x: v0.x - (dx / r.width) * v0.w, y: v0.y - (dy / r.height) * v0.w * aspect, w: v0.w }));
    };
    const up = (e) => { pointers.current.delete(e.pointerId); if (!pointers.current.size) setTimeout(() => { drag.current = null; }, 0); };
    const clicked = (fn) => () => { if (drag.current && drag.current.moved) return; fn(); };
    const btn = { bgcolor: '#fff', border: '1px solid #d5dde3', borderRadius: 1.5, width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 }, '&:hover': { bgcolor: '#f3f6f8' } };
    const tip = (x, y) => ({ left: `${((x - view.x) / view.w) * 100}%`, top: `${((y - view.y) / vh) * 100}%`, transform: `translate(${(x - view.x) / view.w > 0.65 ? '-100%' : '0'}, -112%)` });
    const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }));

    return (
        <Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {[['listed', 'JWC Listed Areas'], ['choke', 'Chokepoints'], ['incidents', 'Incidents']].map(([k, l]) => (
                    <Chip key={k} size="small" label={l} onClick={() => toggle(k)} color={layers[k] ? 'secondary' : 'default'} variant={layers[k] ? 'filled' : 'outlined'} />
                ))}
            </Stack>
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: `1 / ${aspect}`, borderRadius: 1.5, overflow: 'hidden', bgcolor: '#eef4f7' }}>
                <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${vh}`} width="100%" height="100%" role="img"
                    aria-label="Map of JWC Listed Areas, shipping chokepoints and maritime security incidents"
                    style={{ display: 'block', touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
                    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
                    onDoubleClick={(e) => { const [cx, cy] = toMap(e.clientX, e.clientY); zoomAt(2, cx, cy); }}>
                    {layers.listed && WATER_PATHS.map((w) => (
                        <path key={w.name} d={w.d} fill={LISTED} fillOpacity={0.32} stroke={LISTED} strokeWidth={0.6 / scale}
                            onMouseEnter={() => setHover({ type: 'area', name: w.name })} onMouseLeave={() => setHover(null)} />
                    ))}
                    <path d={LAND} fill="#dde5ea" fillRule="evenodd" stroke="none" pointerEvents="none" />
                    {layers.listed && COUNTRY_PATHS.map((c, i) => (
                        <path key={c.name + i} d={c.d} fill={LISTED} fillOpacity={0.5} stroke="#c97b36" strokeWidth={0.4 / scale}
                            onMouseEnter={() => setHover({ type: 'area', name: c.name })} onMouseLeave={() => setHover(null)} />
                    ))}
                    <path d={BORDERS} fill="none" stroke="#ffffff" strokeWidth={0.5 / Math.sqrt(scale)} pointerEvents="none" />
                    {layers.choke && cps.map((c) => {
                        const r = c.r / Math.sqrt(scale);
                        const hot = c.traffic && c.traffic.change_pct !== null ? c.traffic.change_pct <= -30 : c.incidents90 > 0;
                        return (
                            <g key={c.key} onMouseEnter={() => setHover({ type: 'choke', ...c })} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                                <rect x={c.x - r} y={c.y - r} width={2 * r} height={2 * r} transform={`rotate(45 ${c.x} ${c.y})`}
                                    fill={hot ? '#14212b' : '#ffffff'} stroke="#14212b" strokeWidth={1.4 / Math.sqrt(scale)} fillOpacity={0.9} />
                            </g>
                        );
                    })}
                    {layers.incidents && pts.map((p) => {
                        const active = selected === p.link || (hover && hover.link === p.link);
                        const r = (p.recent ? 5.5 : 3.8) / Math.sqrt(scale);
                        return (
                            <g key={p.link} style={{ cursor: 'pointer' }} onMouseEnter={() => setHover({ type: 'incident', ...p })} onMouseLeave={() => setHover(null)}
                                onClick={clicked(() => onSelect && onSelect(p.link))}>
                                <circle cx={p.x} cy={p.y} r={Math.max(r, 8 / scale)} fill="transparent" />
                                <circle cx={p.x} cy={p.y} r={active ? r * 1.5 : r} fill={(KIND_STYLE[p.kind] || KIND_STYLE.harassment).color}
                                    fillOpacity={p.recent ? 0.9 : 0.45} stroke="#fff" strokeWidth={1 / Math.sqrt(scale)} />
                            </g>
                        );
                    })}
                </svg>
                <Stack direction={{ xs: 'row', sm: 'column' }} spacing={0.75} sx={{ position: 'absolute', right: 8, top: { xs: 'auto', sm: 8 }, bottom: { xs: 8, sm: 'auto' } }}>
                    <Tooltip title="Zoom in" placement="left"><IconButton size="small" sx={btn} onClick={() => zoomCentre(1.6)} aria-label="Zoom in"><AddIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Zoom out" placement="left"><IconButton size="small" sx={btn} onClick={() => zoomCentre(1 / 1.6)} aria-label="Zoom out"><RemoveIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Reset view" placement="left"><IconButton size="small" sx={btn} onClick={() => setView(HOME)} aria-label="Reset view"><RestartAltIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
                {hover && hover.type !== 'area' && (
                    <Box sx={{ position: 'absolute', ...tip(hover.x, hover.y), pointerEvents: 'none', bgcolor: '#14212b', color: '#fff', px: 1.25, py: 0.75,
                        borderRadius: 1, fontSize: 12, maxWidth: 260, boxShadow: 2, zIndex: 2 }}>
                        {hover.type === 'incident' ? (<>
                            <div style={{ fontWeight: 600 }}>{hover.title}</div>
                            <div style={{ opacity: 0.8 }}>{fmtDate(hover.published)} · {hover.kind_label} · {hover.region} · {hover.source}</div>
                        </>) : (<>
                            <div style={{ fontWeight: 600 }}>{hover.name}</div>
                            <div style={{ opacity: 0.85 }}>About {hover.oil_mbd}m barrels of oil a day ({hover.oil_period}, EIA)</div>
                            <div style={{ opacity: 0.85 }}>{hover.news90} headlines in 90 days{hover.incidents90 ? ` · ${hover.incidents90} incidents` : ''}</div>
                            {hover.traffic && <div style={{ opacity: 0.85 }}>{hover.traffic.avg7} transits a day, {hover.traffic.change_pct > 0 ? '+' : ''}{hover.traffic.change_pct}% vs {hover.traffic.baseline_label}</div>}
                        </>)}
                    </Box>
                )}
                {hover && hover.type === 'area' && (
                    <Box sx={{ position: 'absolute', left: 10, top: 10, pointerEvents: 'none', bgcolor: '#14212b', color: '#fff', px: 1.25, py: 0.6, borderRadius: 1, fontSize: 12, maxWidth: 280 }}>
                        Listed Area: {hover.name}
                    </Box>
                )}
            </Box>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }} alignItems="center">
                <Stack direction="row" spacing={0.6} alignItems="center"><Box sx={{ width: 14, height: 10, bgcolor: LISTED, opacity: 0.6 }} /><Typography variant="caption" color="text.secondary">JWC Listed Area</Typography></Stack>
                <Stack direction="row" spacing={0.6} alignItems="center"><Box sx={{ width: 9, height: 9, border: '1.5px solid #14212b', transform: 'rotate(45deg)' }} /><Typography variant="caption" color="text.secondary">Chokepoint (size = oil carried; filled = incidents or traffic down 30%+)</Typography></Stack>
                {Object.entries(KIND_STYLE).map(([k, s]) => (
                    <Stack key={k} direction="row" spacing={0.6} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} /><Typography variant="caption" color="text.secondary">{s.label}</Typography></Stack>
                ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                Incidents are placed at the centre of the sea area named in the headline (approximate); bright = last 90 days. Listed Areas drawn approximately from{' '}
                <a href="https://lmalloyds.com/committee/joint-war-committee/" target="_blank" rel="noopener noreferrer">the JWC circular</a>; the circular is the authority.
                Oil flows: <a href="https://www.eia.gov/international/content/analysis/special_topics/world_oil_transit_chokepoints" target="_blank" rel="noopener noreferrer">US EIA</a>. Map: Natural Earth.
            </Typography>
        </Box>
    );
}
