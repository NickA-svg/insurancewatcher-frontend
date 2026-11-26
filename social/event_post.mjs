// Ad hoc "Event watch" post: one news event and where it could touch insurance.
//   node social/event_post.mjs social/events/<file>.json [outDir]
// The JSON holds: kicker, title, sub, rows [[heading, line]], verdict, caption, name.
// Write only what public reporting supports; say "typically" for cover that varies by policy.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3] || path.join(here, 'out', 'events');
const src = fs.readFileSync(path.join(here, 'make_posts.mjs'), 'utf8');
const { page } = new Function("const W=1080,H=1350,SITE='insurancewatcher.news';" +
    src.slice(src.indexOf('const CSS'), src.indexOf('// 1. Catastrophes')) + ';return {page};')();
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = spec.rows.map(([n, m]) => `<div class="row" style="padding:16px 0"><div><div class="name" style="font-size:32px">${esc(n)}</div>
    <div class="meta" style="font-size:25px;line-height:1.3">${esc(m)}</div></div></div>`).join('');
const html = page(`<div class="kicker">${esc(spec.kicker)}</div><h1 style="font-size:58px">${esc(spec.title)}</h1>
    <div class="sub" style="font-size:28px">${esc(spec.sub)}</div>
    <div class="body" style="margin-top:28px"><div style="font-size:24px;color:#9fb0bd;text-transform:uppercase;letter-spacing:.1em">${esc(spec.rowsTitle || 'Where insurance would feel it')}</div>${rows}
    <div style="margin-top:auto;background:#17303f;border-left:6px solid #f0a35b;padding:20px 24px;font-size:27px;line-height:1.35">${esc(spec.verdict)}</div></div>`);

fs.mkdirSync(OUT, { recursive: true });
const { chromium } = await import('playwright');
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await pg.setContent(html, { waitUntil: 'load' });
await pg.screenshot({ path: path.join(OUT, `${spec.name}.png`) });
await browser.close();
fs.writeFileSync(path.join(OUT, `${spec.name}.txt`), spec.caption);
console.log(`event post: ${path.join(OUT, spec.name + '.png')}`);
