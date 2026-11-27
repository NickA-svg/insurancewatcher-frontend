/**
 * Post-build: write crawlable HTML for each line-of-business news page and each Cat Monitor event,
 * plus sitemap.xml / robots.txt / Cloudflare _redirects and _headers.
 *
 * The React app still takes over in the browser; this gives search engines (and slow connections)
 * real content, titles, descriptions and structured data for every page.
 *
 * Env: REACT_APP_API_KEY (API base, trailing slash), SITE_URL (e.g. https://insurancewatcher.news)
 */
import fs from 'node:fs';
import path from 'node:path';

const BUILD = path.resolve('build');
const API = process.env.REACT_APP_API_KEY || '';
const SITE = (process.env.SITE_URL || 'https://insurancewatcher.news').replace(/\/$/, '');
const TAGS = ['Property', 'Casualty', 'Financial Lines', 'Cyber', 'Marine', 'Hull & War', 'Energy', 'Aviation',
    'Terrorism & PV', 'Political Risk & Credit', 'Motor', 'Reinsurance', 'Climate', 'Legislation', 'M&A', 'People'];
const slug = (t) => t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
const bn = (v) => (v >= 10e9 ? (v / 1e9).toFixed(0) : (v / 1e9).toFixed(1));
const sym = (c) => ({ USD: '$', EUR: '€', GBP: '£' }[c] || (c ? c + ' ' : '$'));

async function getJSON(p) {
    const r = await fetch(API + p, { headers: { 'User-Agent': 'InsuranceWatcher-prerender' } });
    if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
    return r.json();
}

// Keep an untouched copy of the app shell: it is the template for every page and the fallback for unknown routes.
const SHELL = path.join(BUILD, 'app-shell.html');
if (!fs.existsSync(SHELL)) fs.copyFileSync(path.join(BUILD, 'index.html'), SHELL);
const template = fs.readFileSync(SHELL, 'utf8');
// The pages below must look right with JavaScript switched off: some company browsers (e.g. Zscaler isolation for
// uncategorised sites) show them read-only, without the React app. So the static HTML carries its own header, cards
// and tables, styled to match the app, and nothing here depends on a script.
const STYLE = `<style>
body{margin:0;background:#f4f6f8}
.pre{font-family:Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#14212b;line-height:1.45;min-height:100vh;display:flex;flex-direction:column}
.pre a{color:#14212b}
.pre-top{background:#122d42;color:#fff}
.pre-top-in{max-width:920px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.pre-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff!important}
.pre-brand b{font-size:20px;font-weight:800;letter-spacing:-.02em}.pre-brand b span{color:#3dd2cc}
.pre-brand small{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:600}
.pre-links{display:flex;gap:16px;flex-wrap:wrap}.pre-links a{color:rgba(255,255,255,.8)!important;text-decoration:none;font-size:14px;font-weight:500;padding:4px 0;border-bottom:2px solid transparent}
.pre-links a.on{color:#fff!important;border-color:#3dd2cc}
.pre-main{max-width:920px;width:100%;box-sizing:border-box;margin:0 auto;padding:24px 16px 40px;flex:1}
.pre h1{font-size:30px;letter-spacing:-.02em;margin:4px 0 6px}.pre h2{font-size:19px;margin:28px 0 10px}
.pre p{color:#5b6b78;margin:0 0 14px}
.pre nav{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 18px}
.pre nav a{font-size:13px;text-decoration:none;color:#14212b;background:#fff;border:1px solid #d5dde3;border-radius:16px;padding:4px 11px}
.pre nav a:hover{border-color:#3dd2cc}
.pre ul{list-style:none;padding:0;margin:0;background:#fff;border:1px solid #e3e8ec;border-radius:12px;overflow:hidden}
.pre li{padding:12px 16px;border-bottom:1px solid #eef2f5}.pre li:last-child{border-bottom:0}
.pre li a{font-weight:600;text-decoration:none}.pre li a:hover{text-decoration:underline}
.pre li small{display:block;color:#5b6b78;font-size:12.5px;margin-top:2px}
.pre table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #e3e8ec;border-radius:12px;overflow:hidden;font-size:14px}
.pre th{background:#f3f6f8;font-weight:600;font-size:12.5px;color:#41525e}
.pre td,.pre th{padding:9px 12px;border-bottom:1px solid #eef2f5;text-align:left;vertical-align:top}
.pre .pre-map{background:#fff;border:1px solid #e3e8ec;border-radius:12px;padding:12px;margin:6px 0 18px}
.pre .pre-map svg{display:block;width:100%;height:auto}
.pre .pre-note{font-size:12px;color:#5b6b78;margin-top:6px}
.pre-foot{border-top:1px solid #e3e8ec;background:#fff}
.pre-foot-in{max-width:920px;margin:0 auto;padding:18px 16px;font-size:12.5px;color:#5b6b78}
.pre-foot a{color:#5b6b78;margin-right:14px}
@media (max-width:600px){.pre h1{font-size:24px}.pre-links{gap:12px}.pre-links a{font-size:13px}.pre-main{padding-top:18px}}
</style>`;
const MARK = `<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0f1f2b"/><path d="M7 32 Q32 8 57 32 Q32 56 7 32 Z" fill="none" stroke="#fff" stroke-width="3.6" stroke-linejoin="round"/><circle cx="32" cy="32" r="11" fill="#13303f" stroke="#3dd2cc" stroke-width="2.6"/><circle cx="32" cy="32" r="2.6" fill="#3dd2cc"/><circle cx="35.6" cy="26" r="1.9" fill="#f0a35b"/></svg>`;
const SECTIONS = [['/', 'News'], ['/cat-monitor/', 'Cat Monitor'], ['/cyber-monitor/', 'Cyber'], ['/marine-monitor/', 'Marine'], ['/market-performance/', 'Performance'], ['/securities-class-actions/', 'Class actions']];
const header = (urlPath) => {
    const on = (href) => (href === '/' ? !SECTIONS.slice(1).some(([h]) => urlPath.startsWith(h)) : urlPath.startsWith(href));
    return `<header class="pre-top"><div class="pre-top-in"><a class="pre-brand" href="/">${MARK}<span><b>Insurance<span>Watcher</span></b><small>Market intelligence</small></span></a>
<div class="pre-links">${SECTIONS.map(([h, l]) => `<a href="${h}"${on(h) ? ' class="on"' : ''}>${l}</a>`).join('')}</div></div></header>`;
};
const FOOTER = `<footer class="pre-foot"><div class="pre-foot-in">InsuranceWatcher collects headlines from public RSS feeds and links every article to its original publisher. Event data from GDACS and USGS; cyber data from CISA and the SEC. Not financial advice.
<div style="margin-top:8px"><a href="/cat-monitor/">Cat Monitor</a><a href="/cyber-monitor/">Cyber Monitor</a><a href="/marine-monitor/">Marine War Monitor</a><a href="/market-performance/">Market performance</a><a href="/securities-class-actions/">Securities class action tracker</a><a href="mailto:insurancewatcher@outlook.com">Contact</a></div></div></footer>`;

function page({ urlPath, title, description, body, jsonld }) {
    const url = SITE + urlPath;
    let html = template
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
        .replace('</head>', `<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" /><meta property="og:site_name" content="InsuranceWatcher" />
<meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" /><meta property="og:image" content="${SITE}/og-card.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" />
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
${STYLE}</head>`)
        .replace('<div id="root"></div>', `<div id="root"><div class="pre">${header(urlPath)}<main class="pre-main">${body}</main>${FOOTER}</div></div>`);
    const out = path.join(BUILD, urlPath, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
}

const navHtml = `<nav><a href="/">All news</a>${TAGS.map((t) => `<a href="/news/${slug(t)}/">${esc(t)}</a>`).join('')}</nav>`;
// Static world map for the Cat Monitor page (same outline and projection as the app's EventMap).
const MAPSRC = fs.readFileSync(path.resolve('src/components/worldMap.js'), 'utf8');
const WM = new Function(MAPSRC.replace(/export const (\w+) =/g, 'var $1 =') + '; return { MAP_W, MAP_H, PROJ, LAND, BORDERS };')();
const HAZ_COL = { TC: '#2f6fb3', WS: '#7c5cc4', EQ: '#b4661f', FL: '#13998f', WF: '#d4452b', VO: '#6b7280', DR: '#b8920f' };
function staticMap(events) {
    const proj = (lat, lon) => { const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180, p2 = p * p, p4 = p2 * p2;
        const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
        const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
        return [WM.PROJ.tx + WM.PROJ.k * x, WM.PROJ.ty - WM.PROJ.k * y]; };
    const pts = events.filter((e) => e.lat != null && e.lon != null);
    const maxN = Math.max(1, ...pts.map((e) => e.article_count || 0));
    const dots = pts.map((e) => ({ e, r: 4 + 14 * Math.sqrt((e.article_count || 0) / maxN) })).sort((a, b) => b.r - a.r).map(({ e, r }) => {
        const [x, y] = proj(e.lat, e.lon);
        return `<a href="/cat-monitor/${e.slug}/"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${HAZ_COL[e.hazard] || '#6b7280'}" fill-opacity=".6" stroke="${e.alert === 'red' ? '#7a1414' : '#fff'}"><title>${esc(e.label)} (${fmtDate(e.start_date)})</title></circle></a>`;
    }).join('');
    return `<div class="pre-map"><svg viewBox="0 0 ${WM.MAP_W} ${WM.MAP_H}" role="img" aria-label="Map of catastrophe events in the last 12 months"><path d="${WM.LAND}" fill="#e8eef2" fill-rule="evenodd"/><path d="${WM.BORDERS}" fill="none" stroke="#fff" stroke-width=".6"/>${dots}</svg>
<div class="pre-note">${pts.length} events in the last 12 months · bubble size = market coverage · approximate locations · map data: Natural Earth</div></div>`;
}
const articleList = (rows) => `<ul>${rows.map((a) => `<li><a href="${esc(a.Link)}" rel="noopener">${esc(a.Title)}</a> <small>${esc(host(a.Link))} · ${fmtDate(a.YearMonthDay)}</small></li>`).join('')}</ul>`;

async function main() {
    const today = new Date().toISOString().slice(0, 10);
    const urls = [{ loc: '/', priority: '1.0', changefreq: 'hourly' }];
    if (!API) { console.warn('prerender: REACT_APP_API_KEY not set; skipping content pages'); }

    // Home page: latest headlines into the main index.html
    try {
        const latest = (await Promise.all([0, 1, 2].map((p) => getJSON(`articles/${p}/All/All`)))).flat();
        page({ urlPath: '/', title: 'InsuranceWatcher · Re/insurance market news, cat losses & cyber intelligence',
            description: 'Free re/insurance and London market intelligence: the latest news by line of business, a market-cycle tracker, catastrophe loss estimates, cyber exposure and market performance.',
            body: `<h1>Latest re/insurance news</h1><p>Headlines from leading market publications, with the market cycle and the events behind it.</p>${navHtml}${articleList(latest)}`,
            jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'InsuranceWatcher', url: SITE },
                { '@context': 'https://schema.org', '@type': 'Organization', name: 'InsuranceWatcher', url: SITE, logo: `${SITE}/logo512.png` }] });
    } catch (e) { console.warn('prerender home:', e.message); }

    // One page per line of business
    for (const t of TAGS) {
        try {
            const rows = (await Promise.all([0, 1, 2].map((p) => getJSON(`articles/${p}/${encodeURIComponent(t)}/All`)))).flat();
            let cycle = '';
            try {
                const m = await getJSON(`market/${encodeURIComponent(t)}/All`);
                const ev = (m.events || []).slice(-8).reverse();
                if (ev.length) cycle = `<h2>Market-moving events for ${esc(t)}</h2><ul>${ev.map((e) => `<li>${esc(e.label)} <small>${fmtDate(e.date)}</small></li>`).join('')}</ul>`;
            } catch { /* market data optional */ }
            page({ urlPath: `/news/${slug(t)}/`, title: `${t} insurance news & market cycle · InsuranceWatcher`,
                description: `Latest ${t.toLowerCase()} insurance and reinsurance news, rate momentum and market-moving events, updated through the day.`,
                body: `<h1>${esc(t)} insurance news</h1><p>${esc(t)} headlines, rate momentum and the events moving the market.</p>${navHtml}${articleList(rows)}${cycle}`,
                jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${t} insurance news`, url: `${SITE}/news/${slug(t)}/` } });
            urls.push({ loc: `/news/${slug(t)}/`, priority: '0.8', changefreq: 'hourly' });
        } catch (e) { console.warn(`prerender ${t}:`, e.message); }
    }

    // Cat Monitor list + one page per significant event
    try {
        const events = await getJSON('events?limit=500');
        page({ urlPath: '/cat-monitor/', title: 'Cat Monitor: catastrophe events, insured loss estimates & market news · InsuranceWatcher',
            description: 'Track global natural catastrophes and the insurance market response: industry loss estimates over time and linked market headlines.',
            body: `<h1>Cat Monitor</h1><p>Global catastrophes and the insurance market's response: how industry loss estimates developed, and the headlines that followed.</p>${staticMap(events.filter((e) => String(e.start_date).slice(0, 10) >= new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10)))}<h2>Events</h2><ul>${events.map((e) => `<li><a href="/cat-monitor/${e.slug}/">${esc(e.label)}</a> <small>${fmtDate(e.start_date)}${e.countries ? ' · ' + esc(e.countries) : ''}</small></li>`).join('')}</ul>`,
            jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Cat Monitor', url: `${SITE}/cat-monitor/` } });
        urls.push({ loc: '/cat-monitor/', priority: '0.9', changefreq: 'hourly' });
        const significant = events.filter((e) => e.article_count >= 3 || e.est_count > 0 || e.alert === 'red');
        for (const e of significant) {
            try {
                const d = await getJSON(`events/${encodeURIComponent(e.slug)}`);
                const est = d.estimates || [];
                const named = est.filter((x) => x.estimator).slice(-4);
                const topHigh = named.length ? Math.max(...named.map((x) => x.high)) : 0;
                const latest = named.filter((x) => x.high >= 0.25 * topHigh);
                const rng = latest.length ? `${sym(latest[0].currency)}${bn(Math.min(...latest.map((x) => x.low)))}–${bn(Math.max(...latest.map((x) => x.high)))}bn` : null;
                const desc = `${d.label} (${fmtDate(d.start_date)})${rng ? `: industry insured loss estimates ${rng}` : ''}. How estimates developed, and the market headlines that followed.`;
                const table = est.length ? `<h2>Industry insured loss estimates</h2><table><tr><th>Date</th><th>Estimate</th><th>Source</th></tr>${est.map((x) => `<tr><td>${fmtDate(x.published)}</td><td>${sym(x.currency)}${bn(x.low)}${x.high > x.low ? '–' + bn(x.high) : ''}bn</td><td><a href="${esc(x.link)}" rel="noopener">${esc(x.estimator || host(x.link))}</a></td></tr>`).join('')}</table>` : '';
                page({ urlPath: `/cat-monitor/${d.slug}/`, title: `${d.label}: insured loss estimates & market news · InsuranceWatcher`, description: desc,
                    body: `<h1>${esc(d.label)}</h1><p>${esc(desc)}</p>${navHtml}${table}<h2>Market headlines</h2>${articleList(d.articles || [])}`,
                    // A catastrophe is not a schema.org Event (Google reads those as ticketed events and asks for
                    // offers, performer and organizer), so describe the page itself and what it is about.
                    jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: `${d.label}: insured loss estimates & market news`,
                        description: desc, url: `${SITE}/cat-monitor/${d.slug}/`, dateModified: new Date().toISOString().slice(0, 10),
                        about: { '@type': 'Thing', name: d.label, description: `Natural catastrophe, ${fmtDate(d.start_date)}${d.countries ? `, ${d.countries}` : ''}` },
                        isPartOf: { '@type': 'CollectionPage', name: 'Cat Monitor', url: `${SITE}/cat-monitor/` },
                        publisher: { '@type': 'Organization', name: 'InsuranceWatcher', url: SITE } } });
                urls.push({ loc: `/cat-monitor/${d.slug}/`, priority: '0.6', changefreq: 'daily' });
            } catch (err) { console.warn(`prerender event ${e.slug}:`, err.message); }
        }
    } catch (e) { console.warn('prerender cat monitor:', e.message); }

    // Marine War Monitor
    try {
        const m = await getJSON('marine');
        const kinds = { attack: 'Attack', mine: 'Mine', seizure: 'Seizure', piracy: 'Piracy', gnss: 'GPS jamming', harassment: 'Harassment' };
        const inc = m.incidents.slice(0, 25).map((i) => `<li><a href="${esc(i.link)}" rel="noopener">${esc(i.title)}</a> <small>${fmtDate(i.published)} · ${kinds[i.kind] || i.kind} · ${esc(i.region)} · ${esc(host(i.link))}</small></li>`).join('');
        const cps = m.chokepoints.map((c) => `<tr><td>${esc(c.name)}</td><td>${c.oil_mbd}</td><td>${c.news90}</td><td>${c.incidents90}</td></tr>`).join('');
        const jwc = m.jwc.changes.map((c) => `<li><b>${esc(c.ref)}</b> (${fmtDate(c.date)}): ${esc(c.summary)} <small>${c.links.map((l) => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</small></li>`).join('');
        page({ urlPath: '/marine-monitor/', title: 'Marine War Monitor: shipping attacks, JWC Listed Areas & war risk for insurers · InsuranceWatcher',
            description: 'Maritime security incidents, JWC Listed Areas changes, shipping chokepoints and what they mean for hull war, cargo war and war P&I insurance. Every item linked to its source.',
            body: `<h1>Marine War Monitor</h1><p>War risk at sea through an insurer's eyes: incidents, JWC Listed Areas, chokepoints and the covers each event tests.</p><ul>${m.insights.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${inc ? `<h2>Incident tracker</h2><ul>${inc}</ul>` : ''}<h2>Chokepoints</h2><table><tr><th>Chokepoint</th><th>Oil, million barrels/day (EIA)</th><th>Headlines, 90 days</th><th>Incidents, 90 days</th></tr>${cps}</table><h2>JWC Listed Areas changes</h2><ul>${jwc}</ul><p><small>Oil flows: <a href="${esc(m.oil_source.url)}" rel="noopener">${esc(m.oil_source.label)}</a>. Listed Areas: <a href="${esc(m.jwc.page)}" rel="noopener">Joint War Committee</a>.</small></p>`,
            jsonld: { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Marine War Monitor', url: `${SITE}/marine-monitor/`,
                description: 'Maritime security incidents from news headlines, JWC Listed Areas changes and shipping chokepoints, for marine and war insurers.', creator: { '@type': 'Organization', name: 'InsuranceWatcher' } } });
        urls.push({ loc: '/marine-monitor/', priority: '0.8', changefreq: 'hourly' });
    } catch (e) { console.warn('prerender marine:', e.message); }

    // Cyber Monitor
    try {
        const cy = await getJSON('cyber');
        const sys = cy.systemic.filter((x) => x.n365 > 0).map((x) => `<tr><td>${esc(x.label)}</td><td>${x.n90}</td><td>${x.n365}</td><td>${x.ransom365}</td></tr>`).join('');
        const evs = cy.events.slice(0, 30).map((e) => `<li>${esc(e.label)} <small>${esc(e.kind)} · ${fmtDate(e.start_date)}${e.est_low ? ` · insured estimates ${sym(e.est_currency)}${bn(e.est_low)}–${bn(e.est_high)}bn` : ''}</small></li>`).join('');
        const sec = cy.sec_latest.slice(0, 20).map((r) => `<li><a href="${esc(r.link)}" rel="noopener">${esc(r.company)}</a> <small>${esc(r.sector)} · ${fmtDate(r.filed)}</small></li>`).join('');
        page({ urlPath: '/cyber-monitor/', title: 'Cyber Monitor: exploited vulnerabilities, cyber incidents & loss events for insurers · InsuranceWatcher',
            description: 'Cyber aggregation risk for insurers: actively exploited vulnerabilities by systemic category, SEC cyber incident disclosures, cyber loss events with insured estimates, cyber pricing and AI exposure.',
            body: `<h1>Cyber Monitor</h1><ul>${cy.insights.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h2>Systemic watch</h2><table><tr><th>Category</th><th>Added, 90 days</th><th>Added, 12 months</th><th>Used by ransomware</th></tr>${sys}</table><h2>Cyber loss events</h2><ul>${evs}</ul>${sec ? `<h2>Cyber incidents disclosed to the SEC</h2><ul>${sec}</ul>` : ''}`,
            jsonld: { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Cyber Monitor for insurers', url: `${SITE}/cyber-monitor/`,
                description: 'Exploited vulnerabilities by aggregation category, SEC cyber incident disclosures and cyber loss events.', creator: { '@type': 'Organization', name: 'InsuranceWatcher' } } });
        urls.push({ loc: '/cyber-monitor/', priority: '0.9', changefreq: 'daily' });
    } catch (e) { console.warn('prerender cyber:', e.message); }

    // Market performance
    try {
        const perf = await getJSON('performance');
        const ll = perf.lloyds.results.filter((r) => r.period === 'FY');
        const llRows = ll.map((r) => `<tr><td>${r.year}</td><td>${r.combined_ratio}%</td><td>£${r.gwp_bn}bn</td></tr>`).join('');
        const coRows = (perf.companies || []).map((c) => `<tr><td>${esc(c.company)}${c.segment ? ' (' + esc(c.segment) + ')' : ''}</td><td>${esc(c.latest.label)}</td><td>${c.latest.value}%</td><td><a href="${esc(c.latest.link)}" rel="noopener">${esc(host(c.latest.link))}</a></td></tr>`).join('');
        page({ urlPath: '/market-performance/', title: "Insurance market performance: Lloyd's and re/insurer combined ratios · InsuranceWatcher",
            description: "Lloyd's market results and reported combined ratios, loss ratios and premiums for listed insurers and reinsurers, each linked to its source.",
            body: `<h1>Market performance</h1><p>Lloyd's market results and the combined ratios re/insurers report.</p><h2>Lloyd's market</h2><table><tr><th>Year</th><th>Combined ratio</th><th>Gross written premium</th></tr>${llRows}</table>${coRows ? `<h2>Reported combined ratios</h2><table><tr><th>Company</th><th>Period</th><th>Combined ratio</th><th>Source</th></tr>${coRows}</table>` : ''}`,
            jsonld: { '@context': 'https://schema.org', '@type': 'Dataset', name: "Lloyd's and re/insurer combined ratios", url: `${SITE}/market-performance/`,
                description: 'Combined ratios and premiums reported by Lloyd\'s and listed re/insurers, linked to source.', creator: { '@type': 'Organization', name: 'InsuranceWatcher' } } });
        urls.push({ loc: '/market-performance/', priority: '0.9', changefreq: 'daily' });
    } catch (e) { console.warn('prerender performance:', e.message); }

    // Securities class action tracker
    try {
        const lit = await getJSON('securities-cases?kind=sca&limit=200');
        const rows = (lit.cases || []).map((c) => `<tr><td>${esc(c.company || c.ticker)} (${esc(c.ticker)})</td><td>${esc(c.sector || '')}</td><td>${c.class_start ? fmtDate(c.class_start) + ' – ' + fmtDate(c.class_end) : ''}</td><td>${fmtDate(c.lead_deadline)}</td><td><a href="${esc(c.latest_link)}" rel="noopener">${fmtDate(c.first_seen)}</a></td></tr>`).join('');
        page({ urlPath: '/securities-class-actions/', title: 'Securities class action tracker: new D&O lawsuits, lead plaintiff deadlines · InsuranceWatcher',
            description: 'New US securities class actions, shareholder derivative suits and plaintiff-firm investigations as they are announced: class periods, lead-plaintiff deadlines, sectors and share drops.',
            body: `<h1>Securities class action tracker</h1><p>New US securities class actions, derivative suits and investigations as they are announced: the D&amp;O claims pipeline.</p>${rows ? `<table><tr><th>Company</th><th>Sector</th><th>Class period</th><th>Lead plaintiff deadline</th><th>First announced</th></tr>${rows}</table>` : ''}`,
            jsonld: { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Securities class action tracker', url: `${SITE}/securities-class-actions/`,
                description: 'US securities class actions and derivative suits compiled from public law-firm announcements.', creator: { '@type': 'Organization', name: 'InsuranceWatcher' } } });
        urls.push({ loc: '/securities-class-actions/', priority: '0.9', changefreq: 'hourly' });
    } catch (e) { console.warn('prerender litigation:', e.message); }

    fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`);
    fs.writeFileSync(path.join(BUILD, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /social/\n\nSitemap: ${SITE}/sitemap.xml\n`);
    // No _redirects file: on Cloudflare Pages redirect rules override real files, so a catch-all would hide every
    // page and asset. Pages already serves the app for unknown paths because the site has no top-level 404.html.
    // Static assets cache for a year (file names are hashed).
    fs.writeFileSync(path.join(BUILD, '_headers'), `/static/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
    console.log(`prerender: wrote ${urls.length} pages + sitemap.xml`);
}

main().catch((e) => { console.error('prerender failed (site still deploys as a normal app):', e); });
