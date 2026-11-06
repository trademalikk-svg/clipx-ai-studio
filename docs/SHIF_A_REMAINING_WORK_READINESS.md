# SHIF-A remaining-work readiness — 6 November 2026

## Implemented on the development branch

### Task 4 — privacy-safe signup analytics
- Added `supabase/drafts/shif_a_signup_analytics.sql`.
- The proposed database triggers count an account once when it is already email-confirmed at insert, or when its email changes from unconfirmed to confirmed.
- The proposed data model stores one UTC date and an aggregate count. It does not store email, user ID, IP address, user agent, referral token, prompt, or content.
- The proposed owner endpoint is `supabase/functions/shif-a-growth-analytics/index.ts`. It validates the JWT with Supabase Auth, checks the server-managed membership role, and returns only daily counts to the Owner.
- Added `scripts/shif-a-growth-analytics.js` and an aggregate analytics panel to the owner-only `growth-manager.html`.
- The browser helper calls the endpoint only after the Owner session and server access profile have been checked.

**Not activated:** The SQL is in `supabase/drafts/`, not the migration history. The Edge Function source is in GitHub but is not deployed. Until both are separately approved and applied, the panel will report that analytics are not installed. No live database change was made.

### Task 5 — daily organic content pipeline
- Added `scripts/daily_growth.py` to generate a dated content draft pack from the current keyword map.
- The pack contains two YouTube Shorts, two Instagram Reels, two Facebook posts, three Pinterest Pins, an SEO article outline, and a 15-minute engagement checklist.
- Each draft labels keyword evidence and avoids claiming unavailable AI features.
- The daily GitHub Actions workflow is scheduled for 08:00 IST and creates/uploads the growth draft pack as a 14-day artifact.
- The workflow uses the Python standard library, public RSS research and GitHub Actions; it requires no paid API key.
- Nothing is posted, scheduled, pushed or published automatically. Owner review remains mandatory.

## Live Supabase read-only review

At the time of inspection:
- The project already has the SHIF-A access Edge Function and membership lookup infrastructure.
- The new `shif-a-growth-analytics` function was not present in the deployed function inventory.
- The analytics aggregate table/function were not present in the live database inventory.
- Security Advisor reported two informational RLS-enabled/no-policy findings for `public.clipx_budget_reservations` and `public.shif_a_model_usage`. These appear intended for server-only access, but the intended access model should be confirmed.
- Security Advisor also reported that leaked-password protection is disabled. This is a dashboard Auth setting and has not been changed.
- Performance Advisor listed four unused-index informational findings. No indexes were removed.

## Remaining activation and release gates

1. Review and approve the SQL draft, then create/apply it through the Supabase migration workflow.
2. Deploy `shif-a-growth-analytics` with JWT verification enabled.
3. Run Supabase security and performance advisors again; confirm the new private table has no browser grants and the service-role-only RPC works.
4. Test a new email-confirmed account in a controlled test flow and verify the daily aggregate increments exactly once.
5. Test Owner access, non-Owner denial, expired-session denial, and the Growth Manager display.
6. Manually run the Daily SEO workflow once and verify both artifacts are uploaded.
7. Perform Android Chrome and desktop browser smoke tests.
8. Review the leaked-password-protection setting and decide whether to enable it in Supabase Auth.
9. Complete independent security/load testing before a public scale-up.

## Latest validation
- GitHub Actions validation passed on commit `e525cea85eab826cc67aa4d44e476eb117e36d2b`.
- Full Python suite: 109 tests passed.
- 12 inline JavaScript blocks across 27 HTML pages passed syntax checks.
- 15 workspace routes and 14 sitemap pages passed the contract checks.
- SHIF-A browser scripts, FFmpeg worker, and all Supabase Edge Functions (including the new analytics function) passed syntax/type checks.
- This is automated CI validation, not a live browser/device test or database integration test.

## Explicitly not done

- No merge to `main`, GitHub Pages production deployment, or social publishing.
- No Supabase migration applied and no Edge Function deployed.
- No paid API, provider secret, ad spend, or subscription activated.
- No claim of a complete device-level QA, penetration test, load test, or live signup analytics.
