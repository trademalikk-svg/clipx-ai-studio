# SHIF-A Daily SEO research

The workflow runs at **06:00 India Standard Time** every day and can also be started manually from **Actions → SHIF-A Daily SEO Research → Run workflow**.

## What it does

1. Reads public Google Trends RSS snapshots for India, the United States, the United Kingdom, Australia and Canada.
2. Records each market's source URL, retrieval timestamp, feed status and returned trend phrases.
3. Includes the existing SHIF-A keyword-map candidates with their current verification status, market, intent, target page and evidence note.
4. Produces a dated Markdown research report and uploads it as a GitHub Actions artifact for 14 days.

## What it does not do

- No OpenAI API key, paid API, paid subscription or third-party analytics service is required.
- It does not edit index.html, any other public page, metadata, sitemap or robots policy.
- It does not create or publish articles, social posts or keyword landing pages.
- It does not commit or push changes to any branch.
- It does not claim search volume, SHIF-A rankings, traffic growth or conversion outcomes from Trends RSS.

## How to view the report on Android

1. Open the repository on GitHub.
2. Tap **Actions**.
3. Open **SHIF-A Daily SEO Research** and select the latest successful run.
4. Scroll to **Artifacts** and tap the report artifact to download it.
5. Open the Markdown report in a text/Markdown viewer.

If every market feed fails or returns no usable trend titles, the job exits with an error and does not upload a successful research report. Partial failures are listed market by market while available markets remain in the report.

## Evidence policy

Google Trends RSS is a directional snapshot of topics currently surfaced by that feed. It is not a monthly search-volume dataset and does not establish SHIF-A's search position. Existing keyword-map entries marked candidate or unverified remain hypotheses until supported by first-party Search Console query evidence or another documented source.

Review the report before deciding whether a phrase is relevant. Public metadata, pages, articles and social content remain drafts until an Owner approves them separately. Search rankings and traffic outcomes are never guaranteed.
