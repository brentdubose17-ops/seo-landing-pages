# Google Indexing Guide — SEO Landing Pages

## Files Created
- `sitemap.xml` — 7 URLs (index + 6 live pages), valid XML sitemap
- `robots.txt` — points crawlers to the sitemap

## How to Submit to Google (Fastest Crawling)

### Step 1: Google Search Console (Primary Method)
1. Go to https://search.google.com/search-console
2. Click "Add property" → choose "URL prefix"
3. Enter: `https://brentdubose17-ops.github.io/seo-landing-pages/`
4. **Verify ownership** — easiest method for GitHub Pages:
   - Choose "HTML file upload" verification
   - Download the HTML verification file
   - Add it to this repo and push (it will be served from GitHub Pages)
   - Or use the TXT record method via your DNS if you have a custom domain
5. Once verified, go to **Sitemaps** in the left sidebar
6. Enter: `sitemap.xml` (or the full URL) → click **Submit**

### Step 2: Ping Google Directly (Instant Notification)
Submit this URL in your browser or via curl:
```
https://www.google.com/ping?sitemap=https://brentdubose17-ops.github.io/seo-landing-pages/sitemap.xml
```
This tells Googlebot to queue the sitemap for crawling immediately.

### Step 3: Request Indexing for Individual Pages (After GSC Setup)
In Search Console → URL Inspection tool:
1. Paste each page URL
2. Click "Request Indexing"
3. This triggers a crawl within hours (not days)

### Step 4: robots.txt (Already Done)
The `robots.txt` in the repo root already declares the sitemap. Google discovers it automatically on its next crawl.

## Current State
- **7 URLs** in sitemap: index + 3 SparkDoc pages + 3 Find AI Agency pages
- **6 peptides pages** are NOT yet live (return 404). Add them to sitemap after deployment
- All pages last modified: **2026-05-07**
- changefreq: weekly | priority: 1.0 (index), 0.8 (all others)

## Ongoing
After pushing new pages, update `sitemap.xml` and resubmit via GSC or ping URL.
