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
const STYLE = `<style>.pre{max-width:920px;margin:0 auto;padding:24px 16px;font-family:Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#14212b}
.pre h1{font-size:28px;margin:8px 0}.pre p{color:#5b6b78}.pre li{margin:6px 0}.pre a{color:#14212b}.pre small{color:#5b6b78}
.pre nav a{margin-right:12px;color:#5b6b78}.pre table{border-collapse:collapse}.pre td,.pre th{padding:4px 10px;border-bottom:1px solid #e3e8ec;text-align:left}</style>`;

function page({ urlPath, title, description, body, jsonld }) {
    const url = SITE + urlPath;
    let html = template
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
        .replace('</head>', `<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" /><meta property="og:site_name" content="InsuranceWatcher" />
<meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" /><meta name="twitter:card" content="summary" />
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
${STYLE}</head>`)
        .replace('<div id="root"></div>', `<div id="root"><div class="pre">${body}</div></div>`);
    const out = path.join(BUILD, urlPath, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
}

const navHtml = `<nav><a href="/">All news</a>${TAGS.map((t) => `<a href="/news/${slug(t)}">${esc(t)}</a>`).join('')}<a href="/cat-monitor">Cat Monitor</a><a href="/market-performance/">Market performance</a><a href="/securities-class-actions/">Securities class actions</a></nav>`;
const articleList = (rows) => `<ul>${rows.map((a) => `<li><a href="${esc(a.Link)}" rel="noopener">${esc(a.Title)}</a> <small>${esc(host(a.Link))} · ${fmtDate(a.YearMonthDay)}</small></li>`).join('')}</ul>`;

async function main() {
    const today = new Date().toISOString().slice(0, 10);
    const urls = [{ loc: '/', priority: '1.0', changefreq: 'hourly' }];
    if (!API) { console.warn('prerender: REACT_APP_API_KEY not set; skipping content pages'); }

    // Home page: latest headlines into the main index.html
    try {
        const latest = (await Promise.all([0, 1, 2].map((p) => getJSON(`articles/${p}/All/All`)))).flat();
        page({ urlPath: '/', title: 'InsuranceWatcher · Re/insurance and London market news',
            description: 'The latest re/insurance and London market news from leading publications, tagged by line of business, with a market-cycle tracker and Cat Monitor.',
            body: `<h1>Latest re/insurance news</h1><p>Headlines from leading market publications, with the market cycle and the events behind it.</p>${navHtml}${articleList(latest)}`,
            jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'InsuranceWatcher', url: SITE } });
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
            body: `<h1>Cat Monitor</h1><p>Global catastrophes and the insurance market's response.</p>${navHtml}<ul>${events.map((e) => `<li><a href="/cat-monitor/${e.slug}/">${esc(e.label)}</a> <small>${fmtDate(e.start_date)}${e.countries ? ' · ' + esc(e.countries) : ''}</small></li>`).join('')}</ul>`,
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
                    jsonld: { '@context': 'https://schema.org', '@type': 'Event', name: d.label, startDate: String(d.start_date).slice(0, 10),
                        ...(d.end_date ? { endDate: String(d.end_date).slice(0, 10) } : {}), eventStatus: 'https://schema.org/EventScheduled',
                        location: { '@type': 'Place', name: d.countries || 'Global' }, description: desc, url: `${SITE}/cat-monitor/${d.slug}/` } });
                urls.push({ loc: `/cat-monitor/${d.slug}/`, priority: '0.6', changefreq: 'daily' });
            } catch (err) { console.warn(`prerender event ${e.slug}:`, err.message); }
        }
    } catch (e) { console.warn('prerender cat monitor:', e.message); }

    // Market performance
    try {
        const perf = await getJSON('performance');
        const ll = perf.lloyds.results.filter((r) => r.period === 'FY');
        const llRows = ll.map((r) => `<tr><td>${r.year}</td><td>${r.combined_ratio}%</td><td>£${r.gwp_bn}bn</td></tr>`).join('');
        const coRows = (perf.companies || []).map((c) => `<tr><td>${esc(c.company)}${c.segment ? ' (' + esc(c.segment) + ')' : ''}</td><td>${esc(c.latest.label)}</td><td>${c.latest.value}%</td><td><a href="${esc(c.latest.link)}" rel="noopener">${esc(host(c.latest.link))}</a></td></tr>`).join('');
        page({ urlPath: '/market-performance/', title: "Insurance market performance: Lloyd's and re/insurer combined ratios · InsuranceWatcher",
            description: "Lloyd's market results and reported combined ratios, loss ratios and premiums for listed insurers and reinsurers, each linked to its source.",
            body: `<h1>Market performance</h1><p>Lloyd's market results and the combined ratios re/insurers report.</p>${navHtml}<h2>Lloyd's market</h2><table><tr><th>Year</th><th>Combined ratio</th><th>Gross written premium</th></tr>${llRows}</table>${coRows ? `<h2>Reported combined ratios</h2><table><tr><th>Company</th><th>Period</th><th>Combined ratio</th><th>Source</th></tr>${coRows}</table>` : ''}`,
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
            body: `<h1>Securities class action tracker</h1><p>New US securities class actions, derivative suits and investigations as they are announced: the D&amp;O claims pipeline.</p>${navHtml}${rows ? `<table><tr><th>Company</th><th>Sector</th><th>Class period</th><th>Lead plaintiff deadline</th><th>First announced</th></tr>${rows}</table>` : ''}`,
            jsonld: { '@context': 'https://schema.org', '@type': 'Dataset', name: 'Securities class action tracker', url: `${SITE}/securities-class-actions/`,
                description: 'US securities class actions and derivative suits compiled from public law-firm announcements.', creator: { '@type': 'Organization', name: 'InsuranceWatcher' } } });
        urls.push({ loc: '/securities-class-actions/', priority: '0.9', changefreq: 'hourly' });
    } catch (e) { console.warn('prerender litigation:', e.message); }

    fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`);
    fs.writeFileSync(path.join(BUILD, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
    // No _redirects file: on Cloudflare Pages redirect rules override real files, so a catch-all would hide every
    // page and asset. Pages already serves the app for unknown paths because the site has no top-level 404.html.
    // Static assets cache for a year (file names are hashed).
    fs.writeFileSync(path.join(BUILD, '_headers'), `/static/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
    console.log(`prerender: wrote ${urls.length} pages + sitemap.xml`);
}

main().catch((e) => { console.error('prerender failed (site still deploys as a normal app):', e); });
