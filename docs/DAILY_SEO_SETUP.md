# ClipX Daily SEO automation setup

The workflow runs at **06:00 India Standard Time** every day and can also be started manually from GitHub Actions.

## What it currently automates

1. Reads Google Trends RSS snapshots for India, the United States, the United Kingdom, Australia and Canada.
2. Asks the configured OpenAI model for one conservative homepage title and meta description.
3. Rejects metadata outside length limits, missing the ClipX brand, containing HTML, or making selected unsupported product claims.
4. Updates only the homepage `<title>` and meta description. It does not rewrite the rest of the site or create articles.
5. Saves a dated report under `seo-reports/` and commits changes when the workflow succeeds.

The international feeds are a practical market sample, not a complete worldwide keyword database. This first version does not connect Google Search Console and does not report actual rankings, clicks or impressions.

## Required one-time setup

After merging this change into the repository's default branch:

1. Open the repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions**.
3. Under **Repository secrets**, select **New repository secret**.
4. Name it exactly `OPENAI_API_KEY` and paste an API key created in the OpenAI Platform.
5. Save it. Never put this key in HTML, JavaScript, a public file, or a chat message.

The OpenAI API is usage-billed separately from a ChatGPT subscription. Set an appropriate API spending limit before enabling the workflow.

Optional: under **Repository variables**, add `OPENAI_SEO_MODEL` if you want to override the default model `gpt-4.1-mini`.

## Run and monitor

- Open **Actions → ClipX Daily SEO → Run workflow** to test it manually after adding the secret.
- Check the run log for the test results and completion status.
- Successful reports appear in `seo-reports/`.
- Scheduled runs use UTC cron `30 0 * * *`, which is 06:00 IST.

If no trend feed is available, the API key is missing, the AI response is invalid, or metadata fails validation, the job stops without changing homepage metadata.

## Important SEO note

Daily title changes are not a guarantee of better rankings. Review the reports and Google Search Console performance periodically. The automation intentionally changes only two homepage metadata fields; it does not publish unreviewed trend articles or invent product capabilities.
