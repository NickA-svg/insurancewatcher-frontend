# Weekly Instagram posts

Every Monday the **Weekly social posts** workflow (`.github/workflows/social.yml`) renders up to three
1080x1350 images from the live API, with captions:

1. **Cat watch**: map of catastrophes in the last 30 days and the ones drawing most coverage
2. **D&O watch**: new US securities class actions in the last 7 days (skipped in quiet weeks)
3. **Results**: combined ratios reported in the last 45 days, or Lloyd's year-by-year results between results seasons

Everything comes from public data already on the site. No commentary, no opinions on companies.

## Posting by hand (default)

GitHub → Actions → Weekly social posts → latest run → Artifacts → download `instagram-posts-<date>`.
Post the PNGs with the text from `captions.md`. Run it any time with **Run workflow**.

## Running it locally

```
npm i --no-save playwright && npx playwright install chromium
API_URL=https://<your-api>/ node social/make_posts.mjs
```

## Optional: publish automatically

Needs an Instagram **professional** (Business or Creator) account linked to a Facebook Page, and a Meta app with
the `instagram_content_publish` permission. Then in the GitHub repo settings:

- Secrets: `IG_USER_ID` (the Instagram account id) and `IG_ACCESS_TOKEN` (a long-lived token)
- Variable: `IG_AUTOPOST` = `true`

The workflow then copies the images to `public/social/<date>/`, waits for Cloudflare to deploy them, and
publishes each post. Remove the variable to go back to posting by hand.
