Plan: docs/plans/2026-11-04-shif-a-core-foundation.md

Task 1: implemented on branch — shared Supabase session helper, private dashboard shell, and authenticated server-side access-profile lookup are present. CI has passed on an earlier branch commit; latest validation after the access backend changes is pending.

Task 2: implemented on branch — searchable AI tools catalog, explicit availability labels, navigation and sitemap entry are present. Model-backed categories remain clearly marked coming soon.

Task 3: implementation draft added on branch — private membership, invitation and audit tables; service-role-only RPC bridge; authenticated access and Owner-only invite/verified-email acceptance Edge Functions. The SQL has NOT been applied to Supabase, the Edge Functions have NOT been deployed, and no Owner/Invited/Customer role has been granted. First Owner bootstrap remains a separate trusted administrator action after confirming the target account.

Next: pass CI and review SQL/function security; then apply the migration and deploy functions in a controlled sequence. Do not merge PR #3 or claim live access until all checks and deployment verification pass.

Task 4: first Coding Studio MVP added on branch — responsive coding workbench page, editable website and Kotlin Android starter templates, isolated website preview, and ZIP source-project export. Catalog marks Coding Studio as limited because model-backed AI generation is not connected and APK compilation/signing is not available. No paid API or service is used.

Verification: GitHub Actions run #224 on commit `2f5594fc181462c1adac3ddd73f2601cdd64c963` passed all 11 validation steps, including 13 Python contract tests, HTML checks, sitemap/local-link checks, browser JavaScript syntax checks, worker syntax, and Deno Edge Function type checks. This is branch validation only; PR #3 remains open and GitHub Pages deployment has not been verified.
