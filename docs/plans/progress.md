Plan: docs/plans/2026-11-04-shif-a-core-foundation.md

Task 1: implemented on branch — shared Supabase session helper, private dashboard shell, and authenticated server-side access-profile lookup are present. CI has passed on an earlier branch commit; latest validation after the access backend changes is pending.

Task 2: implemented on branch — searchable AI tools catalog, explicit availability labels, navigation and sitemap entry are present. Model-backed categories remain clearly marked coming soon.

Task 3: implementation draft added on branch — private membership, invitation and audit tables; service-role-only RPC bridge; authenticated access and Owner-only invite/verified-email acceptance Edge Functions. The SQL has NOT been applied to Supabase, the Edge Functions have NOT been deployed, and no Owner/Invited/Customer role has been granted. First Owner bootstrap remains a separate trusted administrator action after confirming the target account.

Next: pass CI and review SQL/function security; then apply the migration and deploy functions in a controlled sequence. Do not merge PR #3 or claim live access until all checks and deployment verification pass.

Task 4: first Coding Studio MVP added on branch — responsive coding workbench page, editable website and Kotlin Android starter templates, isolated website preview, and JSON source-bundle export. Catalog marks Coding Studio as limited because model-backed AI generation is not connected and APK compilation/signing is not available. No paid API or service is used.

Verification: focused contract tests and Node syntax checks were added to CI. The GitHub contents API did not produce a workflow run for the latest branch commits, and the container could not reach GitHub for a local clone; therefore the latest CI result remains pending. Do not claim the Coding Studio is deployed/live until CI and Pages deployment are verified.
