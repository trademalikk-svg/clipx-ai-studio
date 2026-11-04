Plan: docs/plans/2026-11-04-shif-a-core-foundation.md

Task 1: implemented on branch — shared Supabase session helper, private dashboard shell, and authenticated server-side access-profile lookup are present. CI has passed on an earlier branch commit; latest validation after the access backend changes is pending.

Task 2: implemented on branch — searchable AI tools catalog, explicit availability labels, navigation and sitemap entry are present. Model-backed categories remain clearly marked coming soon.

Task 3: implementation draft added on branch — private membership, invitation and audit tables; service-role-only RPC bridge; authenticated access and Owner-only invite/verified-email acceptance Edge Functions. The SQL has NOT been applied to Supabase, the Edge Functions have NOT been deployed, and no Owner/Invited/Customer role has been granted. First Owner bootstrap remains a separate trusted administrator action after confirming the target account.

Next: pass CI and review SQL/function security; then apply the migration and deploy functions in a controlled sequence. Do not merge PR #3 or claim live access until all checks and deployment verification pass.
