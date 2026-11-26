// Weekly Instagram posts for InsuranceWatcher, rendered from the live API.
//
//   API_URL=https://<api>/ node social/make_posts.mjs [outDir]
//
// Writes 1080x1350 PNGs (Instagram portrait) plus captions.md into social/out/<date>/ (or outDir).
// Needs Playwright with Chromium: npm i --no-save playwright && npx playwright install chromium
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = (process.env.API_URL || process.env.REACT_APP_API_KEY || '').replace(/\/?$/, '/');
const SITE = 'insurancewatcher.news';
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const OUT = process.argv[2] || path.join(here, 'out', iso(today));
const W = 1080, H = 1350;

// world outline shared with the site's map
const mapSrc = fs.readFileSync(path.join(here, '..', 'src', 'components', 'worldMap.js'), 'utf8');
const MAP = new Function(mapSrc.replace(/export const (\w+) =/g, 'var $1 =') + '; return { MAP_W, MAP_H, PROJ, LAND, BORDERS };')();
function project(lat, lon) {
    const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180, p2 = p * p, p4 = p2 * p2;
    const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [MAP.PROJ.tx + MAP.PROJ.k * x, MAP.PROJ.ty - MAP.PROJ.k * y];
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtY = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const HAZ = { TC: ['#2f6fb3', 'Storm'], WS: ['#7c5cc4', 'Windstorm'], EQ: ['#b4661f', 'Earthquake'], FL: ['#13998f', 'Flood'], WF: ['#d4452b', 'Wildfire'], VO: ['#6b7280', 'Volcano'], DR: ['#b8920f', 'Drought'] };

async function get(p) {
    const r = await fetch(API + p, { headers: { 'User-Agent': 'InsuranceWatcher-social' } });
    if (!r.ok) throw new Error(`${p}: ${r.status}`);
    return r.json();
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;font-family:Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#0f1f2b;color:#fff}
.card{position:absolute;inset:0;padding:72px 72px 64px;display:flex;flex-direction:column}
.kicker{font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:#3dd2cc;font-weight:700}
h1{font-size:68px;line-height:1.05;font-weight:800;margin-top:18px;letter-spacing:-.02em}
.sub{font-size:30px;color:#b7c4cf;margin-top:16px;line-height:1.3}
.body{flex:1;margin-top:40px;display:flex;flex-direction:column}
.row{display:flex;align-items:baseline;justify-content:space-between;padding:20px 0;border-bottom:1px solid #26394a;gap:24px}
.row .name{font-size:36px;font-weight:700}
.row .meta{font-size:26px;color:#9fb0bd;margin-top:6px}
.row .val{font-size:44px;font-weight:800;white-space:nowrap}
.good{color:#3dd2cc}.bad{color:#f0a35b}
.foot{display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#9fb0bd;margin-top:28px}
.brand{font-weight:800;color:#fff;font-size:30px}.brand span{color:#3dd2cc}
.legend{display:flex;flex-wrap:wrap;gap:22px;font-size:24px;color:#b7c4cf;margin-top:14px}
.dot{display:inline-block;width:18px;height:18px;border-radius:50%;margin-right:8px;vertical-align:-2px}
.bars{display:flex;align-items:flex-end;gap:18px;height:520px;border-bottom:2px solid #3a4f61;position:relative;margin-top:30px}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.bar b{font-size:28px;margin-bottom:10px}.bar i{display:block;width:100%;border-radius:8px 8px 0 0}
.bar small{position:absolute;bottom:-44px;font-size:26px;color:#9fb0bd}
.be{position:absolute;left:0;right:0;border-top:3px dashed #6d8292}
.be span{position:absolute;right:0;top:-38px;font-size:24px;color:#9fb0bd}
`;
const page = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="card">${inner}
<div class="foot"><div class="brand">Insurance<span>Watcher</span></div><div>${SITE}</div></div></div></body></html>`;

// 1. Catastrophes in the last 30 days on a map
function catPost(events) {
    const since = iso(new Date(today - 30 * 864e5));
    const recent = events.filter((e) => String(e.start_date).slice(0, 10) >= since && e.lat != null && (e.article_count > 0 || e.alert === 'red'));
    if (recent.length < 2) return null;
    const maxN = Math.max(1, ...recent.map((e) => e.article_count || 0));
    const dots = recent.map((e) => {
        const [x, y] = project(e.lat, e.lon); const r = 9 + 26 * Math.sqrt((e.article_count || 0) / maxN);
        const c = (HAZ[e.hazard] || ['#9aa8b3'])[0];
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" fill-opacity=".8" stroke="${e.alert === 'red' ? '#fff' : '#0f1f2b'}" stroke-width="${e.alert === 'red' ? 3 : 1.5}"/>`;
    }).join('');
    const top = [...recent].filter((e) => e.article_count > 0).sort((a, b) => b.article_count - a.article_count).slice(0, 4);
    const haz = [...new Set(recent.map((e) => e.hazard))].filter((h) => HAZ[h]);
    const svg = `<svg viewBox="0 0 ${MAP.MAP_W} ${MAP.MAP_H}" width="936" style="display:block;margin:0 auto"><path d="${MAP.LAND}" fill="#22384a"/><path d="${MAP.BORDERS}" fill="none" stroke="#0f1f2b" stroke-width=".8"/>${dots}</svg>`;
    const html = page(`<div class="kicker">Cat watch · last 30 days</div><h1>${recent.length} catastrophes the market is watching</h1>
        <div class="body">${svg}<div class="legend">${haz.map((h) => `<span><i class="dot" style="background:${HAZ[h][0]}"></i>${HAZ[h][1]}</span>`).join('')}<span>bubble = market coverage</span></div>
        ${top.map((e) => `<div class="row"><div><div class="name">${esc(e.label.replace(/\s*\([A-Z][a-z]{2,3} \d{4}\)$/, ''))}</div><div class="meta">${fmt(e.start_date)}${e.countries ? ' · ' + esc(e.countries.split(',').slice(0, 2).join(',')) : ''}</div></div><div class="val">${e.article_count}<span style="font-size:22px;color:#9fb0bd"> stories</span></div></div>`).join('')}</div>`);
    const caption = `Cat watch: ${recent.length} catastrophe events on the market's radar over the last 30 days. ${top.slice(0, 3).map((e) => e.label.replace(/\s*\([A-Z][a-z]{2,3} \d{4}\)$/, '')).join(', ')} drew the most coverage.\n\nLoss estimates and the full timeline for every event: link in bio (${SITE}/cat-monitor).\n\n#reinsurance #catastrophe #insurance #londonmarket #lloyds #natcat #catbonds #underwriting`;
    return { name: '1-cat-watch', html, caption };
}

// 2. New securities class actions (D&O) in the last 7 days
function suitsPost(lit) {
    const since = iso(new Date(today - 7 * 864e5));
    const fresh = (lit.cases || []).filter((c) => String(c.first_seen).slice(0, 10) >= since);
    if (fresh.length < 2) return null;
    const show = fresh.slice(0, 6);
    const html = page(`<div class="kicker">D&amp;O watch · this week</div><h1>${fresh.length} new securities class action${fresh.length > 1 ? 's' : ''}</h1>
        <div class="sub">Filed in US courts and announced in the last 7 days · allegations only</div>
        <div class="body">${show.map((c) => `<div class="row"><div><div class="name">${esc(c.company || c.ticker)}</div><div class="meta">${esc(c.exchange || '')}${c.exchange ? ': ' : ''}${esc(c.ticker)}${c.sector ? ' · ' + esc(c.sector) : ''}</div></div><div class="val" style="font-size:28px;color:#b7c4cf">${c.lead_deadline ? 'deadline ' + fmt(c.lead_deadline) : ''}</div></div>`).join('')}
        ${fresh.length > show.length ? `<div class="sub" style="margin-top:22px">+ ${fresh.length - show.length} more on the tracker</div>` : ''}</div>`);
    const caption = `D&O watch: ${fresh.length} new US securities class actions this week, including ${show.slice(0, 3).map((c) => c.company || c.ticker).join(', ')}.\n\nAllegations only. Class periods, lead plaintiff deadlines and sectors on the free tracker: link in bio (${SITE}/securities-class-actions).\n\n#DandO #directorsandofficers #financiallines #classaction #insurance #londonmarket #lloyds #underwriting`;
    return { name: '2-dando-watch', html, caption };
}

// 3. Results: combined ratios reported in the last 45 days, or Lloyd's history between results seasons
function resultsPost(perf) {
    const since = iso(new Date(today - 45 * 864e5));
    const fresh = (perf.companies || []).filter((c) => String(c.latest.date).slice(0, 10) >= since).sort((a, b) => a.latest.value - b.latest.value);
    if (fresh.length >= 4) {
        const show = fresh.slice(0, 7);
        const html = page(`<div class="kicker">Results season</div><h1>Combined ratios just reported</h1><div class="sub">Lower is better · below 100% = underwriting profit</div>
            <div class="body">${show.map((c) => `<div class="row"><div><div class="name">${esc(c.company)}</div><div class="meta">${esc(c.latest.label)}${c.segment ? ' · ' + esc(c.segment) : ''}${c.prior ? ` · ${c.prior.label}: ${c.prior.value.toFixed(1)}%` : ''}</div></div><div class="val ${c.latest.value < 100 ? 'good' : 'bad'}">${c.latest.value.toFixed(1)}%</div></div>`).join('')}</div>`);
        const caption = `Results season: combined ratios reported in the last few weeks, from ${show[0].company} at ${show[0].latest.value.toFixed(1)}% to ${show[show.length - 1].company} at ${show[show.length - 1].latest.value.toFixed(1)}%.\n\nEvery figure linked to its source: link in bio (${SITE}/market-performance).\n\n#insurance #reinsurance #combinedratio #londonmarket #lloyds #underwriting #insurancenews`;
        return { name: '3-results', html, caption };
    }
    const fy = perf.lloyds.results.filter((r) => r.period === 'FY').slice(-8);
    const lo = 60, hi = 115, h = (v) => ((v - lo) / (hi - lo)) * 100;
    const bars = fy.map((r) => `<div class="bar"><b class="${r.combined_ratio < 100 ? 'good' : 'bad'}">${r.combined_ratio.toFixed(1)}%</b><i style="height:${h(r.combined_ratio)}%;background:${r.combined_ratio < 100 ? '#1a9f99' : '#d9822b'}"></i><small>${r.year}</small></div>`).join('');
    const last = fy[fy.length - 1], g = perf.lloyds.guidance;
    let streak = 0;
    for (let i = fy.length - 1; i >= 0 && fy[i].combined_ratio < 100; i--) streak++;
    const headline = streak >= 2 && streak < fy.length ? `From losses to ${streak} straight years of profit` : `Lloyd's underwriting, year by year`;
    const html = page(`<div class="kicker">Lloyd's in numbers</div><h1>${headline}</h1>
        <div class="sub">Lloyd's market combined ratio by year</div>
        <div class="body"><div class="bars"><div class="be" style="bottom:${h(100)}%"><span>100% breakeven</span></div>${bars}</div>
        ${g ? `<div class="sub" style="margin-top:70px">${g.year} guidance: ${g.combined_ratio_low}–${g.combined_ratio_high}% on £${g.gwp_bn}bn premium</div>` : ''}</div>`);
    const caption = `Lloyd's combined ratio, ${fy[0].year}–${last.year}: from ${fy[0].combined_ratio}% to ${last.combined_ratio}% on £${last.gwp_bn}bn of premium.${g ? ` Guidance for ${g.year} is ${g.combined_ratio_low}–${g.combined_ratio_high}%.` : ''}\n\nSource: Lloyd's published results. More on the market cycle: link in bio (${SITE}/market-performance).\n\n#lloyds #londonmarket #insurance #reinsurance #combinedratio #underwriting #softmarket`;
    return { name: '3-lloyds', html, caption };
}

// 4. Cyber watch: exploitation pressure by aggregation category, plus SEC incident disclosures
function cyberPost(cy) {
    if (!cy || !cy.tiles || !cy.tiles.kev30) return null;
    const t = cy.tiles;
    const cats = cy.systemic.filter((x) => x.key !== 'other' && x.n90 > 0).sort((a, b) => b.n90 - a.n90).slice(0, 5);
    const max = Math.max(1, ...cats.map((c) => c.n90));
    const bars = cats.map((c) => `<div style="margin:16px 0"><div style="display:flex;justify-content:space-between;font-size:30px"><span>${esc(c.label)}</span><b>${c.n90}</b></div>
        <div style="height:22px;background:#22384a;border-radius:6px;margin-top:8px"><div style="height:100%;width:${(100 * c.n90) / max}%;background:${['edge', 'transfer', 'itops', 'supply'].includes(c.key) ? '#f0a35b' : '#3dd2cc'};border-radius:6px"></div></div></div>`).join('');
    const html = page(`<div class="kicker">Cyber watch · last 90 days</div><h1>${t.kev90} newly exploited vulnerabilities</h1>
        <div class="sub">${t.kev_ransom90} linked to ransomware · ${t.sec90} material incidents disclosed to the SEC</div>
        <div class="body"><div style="font-size:26px;color:#9fb0bd;margin-bottom:6px">Where they sit <span style="color:#f0a35b">(orange = can reach many insureds at once)</span></div>${bars}</div>`);
    const caption = `Cyber watch: ${t.kev90} vulnerabilities newly confirmed as exploited in the last 90 days, ${t.kev_ransom90} of them linked to ransomware, and ${t.sec90} material cyber incidents disclosed by US-listed companies.\n\n${(cy.insights || [])[0] || ''}\n\nSystemic watch, loss events and AI exposure: link in bio (${SITE}/cyber-monitor).\n\nSources: CISA KEV catalogue, SEC EDGAR.\n\n#cyberinsurance #cyber #ransomware #aggregation #insurance #reinsurance #londonmarket #lloyds`;
    return { name: '4-cyber-watch', html, caption };
}

async function main() {
    if (!API || API === '/') throw new Error('Set API_URL to the InsuranceWatcher API');
    const [events, lit, perf, cy] = await Promise.all([get('events?limit=120'), get('securities-cases?kind=sca&limit=100'), get('performance'),
        get('cyber').catch(() => null)]);
    const posts = [catPost(events), cyberPost(cy), suitsPost(lit), resultsPost(perf)].filter(Boolean);
    fs.mkdirSync(OUT, { recursive: true });
    const { chromium } = await import('playwright');
    const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
    const pg = await browser.newPage({ viewport: { width: W, height: H } });
    for (const p of posts) {
        await pg.setContent(p.html, { waitUntil: 'load' });
        await pg.screenshot({ path: path.join(OUT, `${p.name}.png`), type: 'png' });
    }
    await browser.close();
    const md = `# InsuranceWatcher posts for the week of ${iso(today)}\n\n` +
        posts.map((p) => `## ${p.name}.png\n\n${p.caption}\n`).join('\n');
    fs.writeFileSync(path.join(OUT, 'captions.md'), md);
    fs.writeFileSync(path.join(OUT, 'posts.json'), JSON.stringify(posts.map((p) => ({ file: `${p.name}.png`, caption: p.caption })), null, 1));
    // phone-friendly page: hold an image to save it, tap to copy its caption
    const cards = posts.map((p, i) => `<section><img src="${p.name}.png" alt=""><textarea id="c${i}" readonly>${esc(p.caption)}</textarea>
        <button onclick="navigator.clipboard.writeText(document.getElementById('c${i}').value);this.textContent='Copied'">Copy caption</button></section>`).join('');
    fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Posts for ${iso(today)}</title><style>body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;padding:16px;background:#f4f6f8;color:#14212b}
section{background:#fff;border-radius:12px;padding:12px;margin:0 auto 18px;max-width:520px;box-shadow:0 1px 3px rgba(0,0,0,.08)}img{width:100%;border-radius:8px;display:block}
textarea{width:100%;box-sizing:border-box;height:150px;margin-top:10px;font:14px/1.4 inherit;border:1px solid #d5dde3;border-radius:8px;padding:8px}
button{margin-top:8px;width:100%;padding:12px;border:0;border-radius:8px;background:#1a9f99;color:#fff;font-size:16px;font-weight:600}</style></head>
<body><h1 style="font-size:20px;max-width:520px;margin:4px auto 14px">InsuranceWatcher posts · week of ${iso(today)}</h1>${cards}</body></html>`);
    console.log(`social: wrote ${posts.length} posts to ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
