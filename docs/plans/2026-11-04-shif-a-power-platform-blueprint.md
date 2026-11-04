# SHIF-A AI — Power Platform Blueprint (implementation specification)

Status: design and engineering backlog, not a claim that these features are live.
Core promise: one Hindi-first, mobile-first workspace that turns a single brief into multiple coordinated deliverables, with explicit consent and provider cost limits.

## Differentiating product loop
1. **Mission Canvas** — user describes a goal in Hindi or English; system asks only for missing essentials and creates an editable plan.
2. **Artifact Graph** — projects contain linked source assets, scripts, images, clips, subtitles, thumbnails, documents and publishing drafts. Every output records provenance, language, status and revision.
3. **Agent Teams** — optional planner, researcher, writer, designer, video editor and QA reviewer collaborate through a bounded task queue. Every external action requires appropriate permission; no silent posting or spending.
4. **One-to-Many Studio** — one authorized source video or user-owned brief becomes platform-specific Shorts, captions, thumbnail drafts and translated descriptions.
5. **Hindi + regional-language accessibility** — Hindi-first instructions, English fallback and later validated Indian-language packs. Never promise a language until tested.
6. **Provider Router** — choose browser/local/free or approved hosted providers per task, based on actual capability, latency, cost ceiling, privacy and quota. A fallback is not represented as equivalent quality.
7. **Trust Center** — clear distinction between draft, generated, tested, published and failed; user ownership/consent, privacy controls, usage logs and downloadable exports.

## Implementation sequence
### P0 — reliable foundation
- Preserve ClipX features and existing Supabase authentication.
- Keep AI Tools Catalog truthful; do not activate unavailable providers.
- Implement server-verified Owner, Invited and Customer memberships; invitations must be one-time, email-bound, expiring and auditable.
- Make access endpoints deny anonymous users and never trust client role/credit fields.
- Finish CI and test mobile navigation before merge.

### P1 — Mission Canvas MVP
- Create projects and tasks with per-user ownership, RLS and quotas.
- Start with one working workflow: **Video to Shorts Pack** using existing ClipX browser capabilities.
- Save an editable plan, asset references and export manifest; distinguish manual operations from AI inference.
- Provide cancellation, retry and transparent error states.

### P2 — multi-agent execution
- Introduce typed task contracts, human approval gates and bounded execution.
- Add provider adapters one by one only after pricing, privacy, permissions and failure tests.
- Enforce hard server-side cost ceilings, rate limits and per-provider quotas; no unlimited external compute claims.

### P3 — marketplace and business
- Templates and reusable workflows with author attribution and moderation.
- Billing remains disabled until legal/account-owner approval, exact terms, refunds and cost limits are established.

## Minimum contracts
Project: id, owner_user_id, title, language, status, created_at, updated_at.
Artifact: id, project_id, kind, source_artifact_ids, storage_ref, version, status, provenance.
Task: id, project_id, tool_id, requested_by, status, cost_cap_paise, actual_cost_paise, approval_state.
Invitation: hashed token, normalized email, expires_at, accepted_at, invited_by, access scope.
Audit: actor, action, target, result, timestamp, without secrets or full access tokens.

## Release gates
- Every claimed working feature has an end-to-end test.
- Cross-user data access and privilege escalation tests fail closed.
- No provider secrets in HTML, JavaScript bundles or GitHub commits.
- No production merge until CI passes and relevant browser/mobile smoke tests are reviewed.
- No payment or model provider activation without explicit approval.
