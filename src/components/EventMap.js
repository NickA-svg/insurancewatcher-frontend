import React from 'react';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
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

/**
 * World map of catastrophe events. Bubble size follows how much market coverage an event drew; colour is the
 * hazard; a dark ring marks red alerts. Positions are approximate (event epicentre or the place most named).
 */
export default function EventMap({ events, onSelect, selected, height }) {
    const [hover, setHover] = React.useState(null);
    const small = useMediaQuery('(max-width:600px)');
    const grow = small ? 2 : 1; // the map is drawn at a third of its size on phones, so bubbles grow to stay visible
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
    const hazards = [...new Set(pts.map((p) => p.hazard))];

    return (
        <Box>
            <Box sx={{ position: 'relative', width: '100%', maxHeight: height, aspectRatio: `${MAP_W} / ${MAP_H}`, mx: 'auto' }}>
                <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width="100%" height="100%" role="img"
                    aria-label={`World map of ${pts.length} catastrophe events`} style={{ display: 'block' }}>
                    <path d={LAND} fill="#e8eef2" stroke="none" />
                    <path d={BORDERS} fill="none" stroke="#ffffff" strokeWidth="0.6" />
                    {pts.map((p) => {
                        const active = (hover && hover.slug === p.slug) || selected === p.slug;
                        return (
                            <g key={p.slug} style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}
                                onClick={() => onSelect && onSelect(p.slug)}>
                                <circle cx={p.x} cy={p.y} r={Math.max(p.r, 9)} fill="transparent" />
                                <circle cx={p.x} cy={p.y} r={p.r} fill={style(p.hazard).color} fillOpacity={active ? 0.9 : 0.55}
                                    stroke={p.alert === 'red' ? '#7a1414' : '#ffffff'} strokeWidth={p.alert === 'red' ? 1.6 : 1} />
                            </g>
                        );
                    })}
                </svg>
                {hover && (
                    <Box sx={{ position: 'absolute', left: `${(hover.x / MAP_W) * 100}%`, top: `${(hover.y / MAP_H) * 100}%`,
                        transform: `translate(${hover.x > MAP_W * 0.7 ? '-100%' : '0'}, -110%)`, pointerEvents: 'none',
                        bgcolor: '#14212b', color: '#fff', px: 1.25, py: 0.75, borderRadius: 1, fontSize: 12, maxWidth: 240, boxShadow: 2, zIndex: 2 }}>
                        <div style={{ fontWeight: 600 }}>{hover.label}</div>
                        <div style={{ opacity: 0.8 }}>{fmtDate(hover.start_date)} · {hover.article_count} headline{hover.article_count === 1 ? '' : 's'}</div>
                    </Box>
                )}
            </Box>
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
                {pts.length} events mapped · approximate locations · map data: Natural Earth
            </Typography>
        </Box>
    );
}
