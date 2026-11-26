import * as React from 'react';
import { Box } from '@mui/material';

// Published industry insured-loss estimates over time: one dot per estimate, a bar for stated ranges.
export default function EstimateChart({ estimates, height = 240 }) {
    const ref = React.useRef(null);
    const [width, setWidth] = React.useState(600);
    const [tip, setTip] = React.useState(null);
    React.useEffect(() => {
        const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, e.contentRect.width)));
        if (ref.current) ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);
    if (!estimates || !estimates.length) return null;
    const pts = estimates.map((e) => ({ ...e, t: +new Date(e.published + 'T00:00:00'), lo: e.low / 1e9, hi: e.high / 1e9 }));
    const cur = pts[0].currency === 'USD' ? '$' : pts[0].currency === 'EUR' ? '€' : pts[0].currency === 'GBP' ? '£' : pts[0].currency + ' ';
    const m = { l: 52, r: 12, t: 10, b: 28 };
    const t0 = Math.min(...pts.map((p) => p.t)) - 2 * 864e5, t1 = Math.max(...pts.map((p) => p.t)) + 3 * 864e5;
    const rawMax = Math.max(...pts.map((p) => p.hi));
    const step = rawMax > 40 ? 20 : rawMax > 10 ? 5 : rawMax > 4 ? 1 : 0.5;
    const ymax = Math.ceil(rawMax / step) * step;
    const x = (t) => m.l + ((t - t0) / (t1 - t0 || 1)) * (width - m.l - m.r);
    const y = (v) => height - m.b - (v / ymax) * (height - m.t - m.b);
    const fmtV = (v) => `${cur}${v >= 10 ? v.toFixed(0) : v.toFixed(1)}bn`;
    const ticks = [];
    for (let v = 0; v <= ymax + 1e-9; v += step) ticks.push(v);
    const dates = [];
    const n = width < 500 ? 3 : 5;
    for (let i = 0; i <= n; i++) dates.push(t0 + ((t1 - t0) * i) / n);
    return (
        <Box ref={ref} sx={{ position: 'relative' }}>
            <svg width={width} height={height} role="img" aria-label="Industry insured loss estimates over time">
                {ticks.map((v) => (
                    <g key={v}>
                        <line x1={m.l} x2={width - m.r} y1={y(v)} y2={y(v)} stroke="#eef2f4" />
                        <text x={m.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8796a2">{fmtV(v)}</text>
                    </g>
                ))}
                {dates.map((t) => (
                    <text key={t} x={x(t)} y={height - 8} textAnchor="middle" fontSize="11" fill="#8796a2">
                        {new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </text>
                ))}
                {pts.map((p, i) => (
                    <g key={i} onMouseEnter={() => setTip({ p, x: x(p.t), y: y((p.lo + p.hi) / 2) })} onMouseLeave={() => setTip(null)}
                        onClick={() => window.open(p.link, '_blank', 'noopener')} style={{ cursor: 'pointer' }}>
                        {p.hi > p.lo && <line x1={x(p.t)} x2={x(p.t)} y1={y(p.lo)} y2={y(p.hi)} stroke="#1a9f99" strokeWidth="2" strokeLinecap="round" opacity=".5" />}
                        <circle cx={x(p.t)} cy={y((p.lo + p.hi) / 2)} r="5" fill="#1a9f99" stroke="#fff" strokeWidth="2" />
                        <circle cx={x(p.t)} cy={y((p.lo + p.hi) / 2)} r="13" fill="transparent" />
                    </g>
                ))}
            </svg>
            {tip && (
                <Box sx={{ position: 'absolute', left: Math.min(tip.x + 12, width - 220), top: Math.max(tip.y - 10, 0), bgcolor: '#fff', border: '1px solid #e3e8ec',
                    boxShadow: '0 6px 20px rgba(18,45,66,.12)', borderRadius: 1, p: 1, fontSize: 13, pointerEvents: 'none', width: 210 }}>
                    <b>{tip.p.lo === tip.p.hi ? fmtV(tip.p.lo) : `${fmtV(tip.p.lo)} – ${fmtV(tip.p.hi)}`}</b>
                    <div style={{ color: '#5b6b78' }}>{tip.p.estimator || 'Market report'} · {new Date(tip.p.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={{ color: '#5b6b78' }}>Click to read at {tip.p.host}</div>
                </Box>
            )}
        </Box>
    );
}
