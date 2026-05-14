# Google Search Console Setup — SEO Landing Pages
## Site: https://brentdubose17-ops.github.io/seo-landing-pages/

## Step 1: Add Property to Google Search Console
1. Go to https://search.google.com/search-console
2. Sign in with abdlegacyllc@gmail.com (or your Google account)
3. Click "Add Property" → "URL prefix"
4. Enter: `https://brentdubose17-ops.github.io/seo-landing-pages/`
5. Choose verification method: **HTML file upload** (easiest for GitHub Pages)

## Step 2: Verify Ownership
1. Download the `googleXXXXXX.html` verification file from GSC
2. Upload it to the `~/seo-pages/` repo directory
3. Git add/commit/push
4. Click "Verify" in GSC — it checks the file is live at `https://brentdubose17-ops.github.io/seo-landing-pages/googleXXXXXX.html`

## Step 3: Submit Sitemap
1. In GSC, go to "Sitemaps" in the left sidebar
2. Enter: `sitemap.xml`
3. Click Submit

## Step 4: Request Indexing (for immediate crawling)
- Use the "URL Inspection" tool in GSC
- Paste a page URL, click "Request Indexing"
- Google crawls it within minutes-hours vs weeks

## Alternative: Google Indexing API (automated)
For programmatic submission, we can use the Indexing API:
1. Create a Google Cloud project
2. Enable the Indexing API
3. Create a service account → download JSON key
4. Add the service account email as an owner in GSC
5. Then a Python script can submit batch URLs daily

I can set up steps 1-3 when you're ready. Step 4 needs you to add the service account in GSC.
