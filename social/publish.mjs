// Optional: publish this week's posts to Instagram through the Instagram Graph API.
// Only runs from the GitHub workflow when the repository variable IG_AUTOPOST is 'true' and the secrets
// IG_USER_ID and IG_ACCESS_TOKEN are set. Images must already be live on the site (public/social/<date>/).
//
//   node social/publish.mjs public/social/2026-11-30
import fs from 'fs';
import path from 'path';

const dir = process.argv[2];
const { IG_USER_ID, IG_ACCESS_TOKEN, SITE_URL = 'https://insurancewatcher.news' } = process.env;
const GRAPH = 'https://graph.facebook.com/v21.0';

async function call(url, params) {
    const r = await fetch(`${url}?${new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN })}`, { method: 'POST' });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j));
    return j;
}

async function main() {
    if (!IG_USER_ID || !IG_ACCESS_TOKEN) throw new Error('IG_USER_ID and IG_ACCESS_TOKEN are required');
    const posts = JSON.parse(fs.readFileSync(path.join(dir, 'posts.json'), 'utf8'));
    const webDir = dir.replace(/^public/, '');
    for (const p of posts) {
        const image_url = `${SITE_URL}${webDir}/${p.file}`;
        const media = await call(`${GRAPH}/${IG_USER_ID}/media`, { image_url, caption: p.caption });
        await new Promise((r) => setTimeout(r, 5000));
        const done = await call(`${GRAPH}/${IG_USER_ID}/media_publish`, { creation_id: media.id });
        console.log(`published ${p.file} as ${done.id}`);
    }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
