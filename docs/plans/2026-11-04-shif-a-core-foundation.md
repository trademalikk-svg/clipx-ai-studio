# SHIF-A AI Core Foundation Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing ClipX-based SHIF-A AI dashboard into a truthful, authenticated AI platform foundation with a shared customer workspace, a searchable AI tool catalog, and a secure path to Owner, Invited User, and paid Customer access.

**Architecture:** Keep the existing GitHub Pages application and Supabase project. Preserve the current ClipX editor and Supabase authentication. Add small standalone pages and shared browser helpers; keep role and entitlement decisions server-authoritative using Supabase `app_metadata`/verified claims and RLS/Edge Functions. Do not activate any paid AI provider or real billing.

**Tech Stack:** HTML, CSS, browser JavaScript, GitHub Pages, Supabase Auth/Postgres/Edge Functions, Python unittest, Node.js syntax checks, existing GitHub Actions workflow.

## Global Constraints

- Modify the existing `trademalikk-svg/clipx-ai-studio` repository; do not create a separate product site.
- Keep SHIF-A AI as the primary platform brand and ClipX Video Studio as its video module.
- Preserve the existing root dashboard, ClipX editing behavior, Supabase login, upload safeguards, and Free Browser Mode guards.
- Never describe planned or unconnected AI tools as operational. Use explicit `available`, `limited`, `beta`, or `coming-soon` states.
- Owner and explicitly invited users may have unlimited platform credit access; this does not remove external provider quotas, device limits, or compute costs.
- Customers must use an approved paid plan/credit policy before paid features are enabled. Do not invent prices, credit amounts, or provider costs.
- No paid provider, API, GPU, subscription, or live payment flow may be activated without explicit adult account-owner approval and provider-side cost controls.
- Keep provider secrets and Supabase service-role credentials server-side. Never use user-editable `user_metadata` for authorization.
- Customer data is scoped to the authenticated user. Privileged actions require server-side role verification and auditable changes.
- Do not claim unlimited worldwide AI generation or integration of every proprietary AI service. The catalog may list external tools only with accurate availability and integration labels.
- Test on mobile and desktop; do not claim deployment success until GitHub Actions Pages deployment completes.

---

### Task 1: Add shared authentication helper and customer dashboard shell

**Files:**
- Create: `scripts/shif-a-auth.js` — shared Supabase client/session and safe display-only role resolver.
- Create: `dashboard.html` — authenticated customer workspace with account, projects, tools, history, plan, and settings panels.
- Create: `scripts/shif-a-dashboard.js` — session gating and truthful account/role state rendering.
- Create: `tests/test_shif_a_workspace.py` — static contract tests for auth gating, private routes, and truthful empty states.
- Modify: `index.html` — add a clear Dashboard link without changing the existing ClipX authentication/editor code.
- Modify: `.github/workflows/validate.yml` — include the new structural test and keep existing ClipX checks intact.

**Interfaces:**
- `window.ShifAAuth.getSession()` returns `{ session, error }`.
- `window.ShifAAuth.requireSession(loginUrl)` returns the verified session or redirects to the login entry point with a safe return path.
- `window.ShifAAuth.signOut()` signs out the current Supabase session.
- `window.ShifAAuth.getDisplayAccess(user)` reads only server-managed `user.app_metadata.shif_role` and `shif_access` for display. It does not authorize data access or privileged operations.
- Dashboard sections: Overview, My Projects, AI Tools, History, Membership, Credits, and Settings.
- Missing backend data is rendered as “not connected yet”; no demo balances, fake revenue, or invented usage metrics.

- [ ] Add failing tests asserting the dashboard is noindex, loads the shared auth helper, requires a valid session, shows neutral empty states, and does not contain service-role keys or hardcoded Owner identity.
- [ ] Run `python3 -m unittest tests.test_shif_a_workspace`; confirm failure because the new page/helper do not exist.
- [ ] Implement the helper using the existing public Supabase project URL and publishable key. Verify sessions with `auth.getSession()` and `auth.getUser()`; use `app_metadata` only for display labels. Do not read roles from `user_metadata`.
- [ ] Build the responsive dashboard shell. Unauthenticated visitors are redirected to the existing ClipX login route; after login, the return path is validated as a same-origin relative path.
- [ ] Add a Dashboard entry to the SHIF-A navigation. Do not disturb the existing ClipX navigation/router.
- [ ] Run `python3 -m unittest tests.test_shif_a_workspace` and `node --check scripts/shif-a-auth.js && node --check scripts/shif-a-dashboard.js`; expect all checks to pass.
- [ ] Run the existing GitHub Actions validation workflow; retain all existing upload, Free Browser Mode, sitemap, and Edge Function checks.
- [ ] Commit this independently passing deliverable.

### Task 2: Add a full AI tools catalog with truthful availability

**Files:**
- Create: `ai-tools.html` — searchable and filterable catalog grouped by Video, Image, Voice, Chat & Research, Writing, Coding, Agents, Automation, Documents, Design, Education, Business, and Productivity.
- Create: `scripts/shif-a-tools.js` — client-side search/category filtering from a static, reviewed registry.
- Create: `tests/test_shif_a_tools.py` — tool registry and route contract tests.
- Modify: `index.html` — link the top navigation and catalog cards to `ai-tools.html`.
- Modify: `sitemap.xml` — add the public catalog page only.
- Modify: `.github/workflows/validate.yml` — include the new catalog tests and sitemap expectation.

**Interfaces:**
- Each catalog entry has `id`, `name`, `category`, `description`, `status`, and optional `href`.
- Only currently working ClipX browser tools are `available` or `limited`; future model-backed tools remain `coming-soon`.
- Search filters by name, category, and description; status/category filters are keyboard accessible.

- [ ] Add failing tests for unique IDs, valid categories/status values, local link targets, and the rule that a coming-soon tool cannot have an active generation action.
- [ ] Run `python3 -m unittest tests.test_shif_a_tools`; confirm expected failures.
- [ ] Implement the catalog and accessible filters. Link verified video/creator tools to existing ClipX routes; keep Image, Voice, Chat, Coding, Agents, and Automation as coming-soon until a real engine is integrated and tested.
- [ ] Run the focused Python test and `node --check scripts/shif-a-tools.js`; expect all tests to pass.
- [ ] Run full GitHub Actions validation and verify sitemap/canonical/local links.
- [ ] Commit this independently passing deliverable.

### Task 3: Implement secure Owner, Invited User, and Customer access foundation

**Files:**
- Create: `supabase/migrations/<timestamp>_shif_a_access_foundation.sql` — additive membership, invitation, and audit schema.
- Create: `supabase/functions/shif-a-access/index.ts` — authenticated access-profile endpoint.
- Create: `supabase/functions/shif-a-invite/index.ts` — Owner-only invitation workflow.
- Create: `tests/test_shif_a_access_contract.py` — role, invite, ownership, and privilege-boundary tests.
- Modify: `dashboard.html` and `scripts/shif-a-dashboard.js` — show server-returned access state and invite-management entry only to verified Owner.

**Interfaces:**
- Access roles: `owner`, `invited`, `customer`.
- Access endpoint returns the authenticated user's role, enabled tool IDs, and platform-credit policy; it never accepts a client-supplied role or balance.
- Invite endpoint accepts an email and a server-approved tool-access set; only a verified Owner may call it. Invitation acceptance is tied to the authenticated email and a single-use invitation token.
- Owner and invited access may bypass platform credit deductions, but all provider usage still passes provider quota and cost guardrails.
- Role assignment is stored in server-managed `app_metadata` or a protected membership table; never in user-editable metadata.
- First Owner bootstrap requires a one-time server-side administrative action. Do not guess which existing account belongs to the Owner.

- [ ] Add failing contract tests for anonymous denial, customer denial of invite operations, invited-user scope, single-use invite acceptance, and rejection of client-supplied roles/balances.
- [ ] Review current Supabase migrations, grants, RLS, existing support-admin claims, and project Data API exposure before writing DDL.
- [ ] Implement additive tables/policies and Edge Functions. Keep service-role use inside Edge Functions; enforce role checks server-side; log privileged changes.
- [ ] Apply the migration only after the SQL has been reviewed against current project schema. Do not create a billable Supabase branch or enable paid features.
- [ ] Verify with SQL tests, Edge Function checks, and Supabase security/performance advisors.
- [ ] Commit migration, functions, and tests; deploy Edge Functions only after their contracts pass.

## Unresolved decisions before billing/provider activation

1. Which existing authenticated account is the initial Owner; it must be explicitly confirmed before the one-time Owner bootstrap.
2. Which AI providers/models are approved for each category, including terms, privacy, quotas, and costs.
3. Exact customer prices, credit quantities, included tools, expiry/rollover, refunds, and cancellation rules.
4. Payment provider and required adult account-owner oversight for live payment setup.
5. Whether invited users receive every available tool by default or a selected tool set.

These decisions do not block Tasks 1 and 2. Task 3 can be built with a secure bootstrap seam, but Owner privileges must remain unassigned until the account is confirmed.
