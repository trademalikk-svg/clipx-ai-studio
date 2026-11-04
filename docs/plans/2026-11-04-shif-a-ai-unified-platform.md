# SHIF-A AI Unified Platform Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the current ClipX AI Studio GitHub Pages site into one unified SHIF-A AI platform with a premium public homepage, preserved ClipX Video Studio, customer workspace, AI tool directory, and a safe path to membership, credits, billing, and admin operations.

**Architecture:** Keep GitHub Pages as the public static frontend and Supabase as the existing authentication/data/Edge Function backend. Preserve the current large ClipX application as a dedicated Video Studio page, move the public root to the SHIF-A AI homepage, and add focused pages/modules for the customer workspace and tool catalog. Backend-authoritative Supabase tables and Edge Functions own user data, credit accounting, entitlements, and any future payment verification; browser code never decides balances, admin rights, or payment success.

**Tech Stack:** HTML, CSS, browser JavaScript, GitHub Pages, Supabase Auth/Postgres/Edge Functions (Deno), SQL migrations, existing GitHub Actions validation workflow, Python standard-library validation scripts, Node.js syntax checks.

## Global Constraints

- Use Navy Blue + Electric Blue + White with a clean, restrained premium SaaS visual style.
- The website is one product, one customer identity, and one login. ClipX remains a Video Studio inside SHIF-A AI, not a separate product or lost feature set.
- Preserve existing verified ClipX behavior and routes where practical. Existing working browser-side video tools remain accessible.
- Do not claim cloud rendering, cloud upload, semantic AI highlights, external AI generation, or any new AI tool is operational until a real backend/provider implementation is configured and tested.
- Do not promise 10 GB processing. Current repository documentation states local file selection is capped at 3 GB and cloud upload backend is capped at 2 GiB.
- No paid provider, paid API, billing product, or paid infrastructure may be activated without explicit budget approval. Existing `BUDGET_GUARDRAILS.md` requires paid services disabled by default, server-side cost reservation, fail-closed behavior, and provider-side controls.
- Never put secrets, service-role keys, or provider credentials in public HTML/JavaScript or the repository.
- Customer data must be scoped to the authenticated user. Admin privileges must be verified server-side using a server-managed role claim; client-side hiding is not authorization.
- Credit balances, credit debits/refunds, monthly renewals, subscription entitlements, and payment state must be server-authoritative and auditable.
- Pricing, monthly credit quantities, AI providers, and payment provider are not decided by this plan. Do not invent them or activate paid functionality.
- Update SEO metadata, sitemap, robots rules, privacy disclosures, and terms only to reflect real deployed behavior.
- Test mobile and desktop behavior; no success claims without passing the repository checks and relevant browser/backend tests.

---

### Task 1: Introduce the SHIF-A AI public homepage and preserve ClipX as a separate studio page

**Files:**
- Create: `clipx-studio.html` — proposed preserved copy of the current `index.html` ClipX application.
- Modify: `index.html` — replace the root page with the SHIF-A AI public homepage.
- Create: `styles/shif-a.css` — proposed shared visual tokens, responsive navigation, hero, cards, and footer styles.
- Create: `scripts/shif-a-home.js` — proposed public homepage navigation and non-authenticated interactions.
- Modify: `sitemap.xml` — include the new public ClipX Studio route and canonical public pages.
- Modify: `.github/workflows/validate.yml` — update route-map and Free Browser Mode checks to inspect `clipx-studio.html` after the existing ClipX app moves there; retain current safeguards and expected page checks.
- Modify: `README.md` — document SHIF-A AI as the platform and ClipX as its Video Studio.
- Test: existing workflow checks in `.github/workflows/validate.yml`.

**Interfaces:**
- Consumes: existing ClipX root app markup, styles, script behavior, links, Supabase client configuration, and current SEO/Free Browser Mode guards from `index.html`.
- Produces: public root `index.html` with stable links to `clipx-studio.html`, `ai-tools.html`, `dashboard.html`, `about.html`, `contact.html`, `privacy.html`, and `terms.html`.
- The preserved ClipX page must retain its existing section IDs and route-map contract; validation checks that contract against `clipx-studio.html`, not the new landing page.

- [ ] **Step 1: Add focused failing structural tests**

Add a Python test module such as `tests/test_shif_a_site.py`. Assert that the root homepage contains the SHIF-A AI title/brand, Navy/Electric Blue design tokens, primary navigation links, ClipX Studio link, AI Tools link, pricing section, and legal/support links. Assert that `clipx-studio.html` retains the current ClipX key IDs and the Free Browser Mode guard strings. Assert that every local homepage link resolves to a file and each public page has a unique canonical URL.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_site`

Expected: the test fails because the SHIF-A homepage, preserved studio page, and updated routes do not yet exist.

- [ ] **Step 3: Implement the minimum public-site transition**

Copy the current root application to `clipx-studio.html` without changing its tool logic. Replace only the root `index.html` with the SHIF-A public landing page. Add responsive shared CSS in `styles/shif-a.css`; add only navigation and accessible menu behavior in `scripts/shif-a-home.js`. Make the old ClipX navigation link point to `clipx-studio.html`. Preserve the current Free Browser Mode and upload/generation guards unchanged in the moved app. Update the workflow's existing section-route check and Free Browser Mode checks to read `clipx-studio.html`; retain its JavaScript syntax, sitemap, local-link, worker, and Deno checks. Add the new public URL to sitemap and give the new root page accurate title, description, canonical, Open Graph, and structured data.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_site`

Expected: all SHIF-A public-homepage, preserved-ClipX, canonical, and local-link assertions pass.

- [ ] **Step 5: Run the affected integration checks**

Run: `python3 - <<'PY'
import pathlib, re, subprocess, tempfile
pages=sorted(pathlib.Path('.').glob('*.html'))
count=0
for page in pages:
 html=page.read_text(encoding='utf-8')
 for i,(attrs,src) in enumerate(re.findall(r'<script\\b([^>]*)>(.*?)</script\\s*>',html,re.I|re.S)):
  if not src.strip() or re.search(r'\\bsrc\\s*=',attrs,re.I) or re.search(r'application/ld\\+json',attrs,re.I): continue
  suffix='.mjs' if re.search(r'type\\s*=\\s*[\\\"\\']module[\\\"\\']',attrs,re.I) else '.js'
  p=pathlib.Path(tempfile.gettempdir())/f'shif-a-{page.stem}-{i}{suffix}'; p.write_text(src,encoding='utf-8'); subprocess.run(['node','--check',str(p)],check=True); count+=1
if not count: raise SystemExit('No inline JavaScript checked')
print(f'Syntax OK: {count} inline JavaScript blocks across {len(pages)} HTML pages.')
PY`
Run the GitHub Actions `Validate ClipX` workflow on the branch.

Expected: all inline scripts pass Node syntax checks; the existing section route map, sitemap/canonical, noindex admin, secret-file, Free Browser Mode, upload limits, local links, worker syntax, and Deno checks pass with the new file layout.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add index.html clipx-studio.html styles/shif-a.css scripts/shif-a-home.js sitemap.xml .github/workflows/validate.yml README.md tests/test_shif_a_site.py
git commit -m "feat: introduce SHIF-A AI public homepage"
```

### Task 2: Add the unified AI tools directory and customer dashboard shell

**Files:**
- Create: `ai-tools.html` — proposed searchable/category-based catalog of available and clearly labeled planned tools.
- Create: `dashboard.html` — proposed authenticated customer workspace shell.
- Create: `styles/shif-a-workspace.css` — proposed workspace/sidebar/cards/mobile layout styles.
- Create: `scripts/shif-a-auth.js` — proposed shared Supabase session helper for customer-facing pages.
- Create: `scripts/shif-a-dashboard.js` — proposed dashboard data loading and navigation.
- Modify: `scripts/shif-a-home.js` — add sign-in/get-started navigation using the shared auth flow.
- Modify: `sitemap.xml` — add only public `ai-tools.html`; do not add private customer dashboard routes to the sitemap.
- Create: `tests/test_shif_a_workspace.py`.

**Interfaces:**
- Consumes: current Supabase browser client configuration and authentication behavior after review; public routes from Task 1.
- Produces: `window.ShifAAuth.getSession()`, `window.ShifAAuth.requireSession()`, and `window.ShifAAuth.signOut()` as shared customer-page helpers. These helpers return explicit session/error results and never grant admin privileges.
- Dashboard sections: Account, Overview, AI Tools, My Projects, Content History, Downloads, Credits, Membership, Payments, and Settings.
- Catalog entries carry a stable slug, title, category, description, and explicit availability state: `available`, `limited`, `beta`, or `coming-soon`.

- [ ] **Step 1: Add focused failing tests**

Assert that the catalog groups tools by category, labels each tool with an explicit availability state, and never labels planned tools as active. Assert that dashboard navigation includes all required customer sections, protected pages do not expose user data without a session, and private dashboard pages are absent from the public sitemap.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_workspace`

Expected: tests fail because the catalog, dashboard, and shared customer auth helper are not present.

- [ ] **Step 3: Implement catalog and dashboard shell**

Create the tool directory with current ClipX tools linked to `clipx-studio.html`. Add new tool cards as `coming-soon` unless a tested implementation exists. Build a responsive dashboard shell with left navigation on desktop and compact navigation on mobile. Reuse existing Supabase Auth only after verifying its session behavior; redirect unauthenticated users to the login entry point and return them to the intended page after successful login. Display actual authenticated account information only. Show credits, membership, project counts, and content history as empty/unavailable states until backend sources exist; do not show sample/demo numbers as live account data. Keep dashboard pages out of sitemap and set appropriate robots directives.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_workspace`

Expected: catalog, route, auth-gating, private-page, and truthful-empty-state assertions pass.

- [ ] **Step 5: Run affected integration checks**

Run: `node --check scripts/shif-a-auth.js && node --check scripts/shif-a-dashboard.js && node --check scripts/shif-a-home.js`, then run the GitHub Actions `Validate ClipX` workflow.

Expected: all new scripts parse; all site-wide script, link, canonical, sitemap, and existing ClipX checks pass.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add ai-tools.html dashboard.html styles/shif-a-workspace.css scripts/shif-a-auth.js scripts/shif-a-dashboard.js scripts/shif-a-home.js sitemap.xml tests/test_shif_a_workspace.py
git commit -m "feat: add SHIF-A AI tools and customer workspace"
```

### Task 3: Implement backend-authoritative projects, content history, monthly credits, and plan entitlements

**Files:**
- Create: `supabase/migrations/<timestamp>_shif_a_customer_workspace.sql` — proposed schema for customer projects, generated content metadata, credit ledger, plan entitlements, and monthly allowance periods.
- Create: `supabase/functions/shif-a-dashboard/index.ts` — proposed authenticated dashboard summary endpoint.
- Create: `supabase/functions/shif-a-credit-consume/index.ts` — proposed atomic credit reservation/consumption endpoint.
- Create: `supabase/functions/shif-a-credit-release/index.ts` — proposed reservation release/refund endpoint for failed/cancelled jobs.
- Create: `supabase/functions/shif-a-monthly-renewal/index.ts` — proposed scheduled/idempotent monthly allowance renewal endpoint.
- Create: `tests/test_shif_a_credit_contract.py`.
- Modify: `dashboard.html` and `scripts/shif-a-dashboard.js` to consume the new endpoints.

**Interfaces:**
- Dashboard endpoint: authenticated user token in Authorization header; returns only that user's profile summary, project/content metadata, current entitlement, credit balance, and ledger summary.
- Credit consume endpoint: authenticated user token plus a server-recognized tool/job identifier and requested credit amount derived from server-side tool pricing; returns reservation/transaction ID and remaining balance or a stable rejection reason.
- Credit release endpoint: authenticated user token plus reservation/job ID and release reason; only the owner or authorized server process can release an eligible reservation; repeated release is idempotent.
- Monthly renewal endpoint: invoked only by a trusted scheduled/server identity; uses a unique user+period key to prevent duplicate credits.
- Plan labels may be Free/Pro/Premium in UI, but included credits, prices, rollover, expiry, and entitlement matrix remain configuration decisions until the owner approves values.

- [ ] **Step 1: Add focused failing contract tests**

Test that customer rows are owned by authenticated user IDs; anonymous requests are rejected; a user cannot query another user's history; negative/zero/oversized credit requests are rejected according to the server-defined tool pricing policy; simultaneous requests cannot overspend a balance; a failed job can release a reservation only once; monthly renewal cannot grant credits twice for the same account and billing period; and client-provided balance/price fields are ignored.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_credit_contract`

Expected: tests fail because the SHIF-A schema and Edge Function contracts do not yet exist.

- [ ] **Step 3: Implement schema and server-authoritative endpoints**

Inspect existing Supabase migrations and RLS conventions before adding tables. Add ownership foreign keys, RLS policies, indexes, and constraints for credit ledger transaction types and unique monthly renewal keys. Keep credit mutations inside database transactions/RPCs so concurrent jobs cannot overspend. Derive user identity from the verified Supabase JWT, not request body fields. Restrict renewal to a trusted scheduler/service identity. Do not expose service-role keys. Make all endpoints fail closed if the ledger, pricing config, or user entitlement cannot be read. Keep paid AI generation disabled; the ledger supports approved future usage and must not itself activate a provider.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_credit_contract` and run Deno checks on each new function with `deno check supabase/functions/shif-a-dashboard/index.ts supabase/functions/shif-a-credit-consume/index.ts supabase/functions/shif-a-credit-release/index.ts supabase/functions/shif-a-monthly-renewal/index.ts`.

Expected: all credit-contract tests pass and Deno reports no type errors.

- [ ] **Step 5: Run affected integration checks**

Run the repository's `Validate ClipX` GitHub Actions workflow and the Supabase migration/RLS tests available in the connected Supabase project before deployment.

Expected: existing Edge Functions still type-check; new migrations apply without weakening existing clip-job or support-ticket policies; user-isolation tests pass.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add supabase/migrations supabase/functions/shif-a-dashboard supabase/functions/shif-a-credit-consume supabase/functions/shif-a-credit-release supabase/functions/shif-a-monthly-renewal dashboard.html scripts/shif-a-dashboard.js tests/test_shif_a_credit_contract.py
git commit -m "feat: add SHIF-A customer credits and history backend"
```

### Task 4: Integrate verified ClipX tools, admin operations, and future billing seams

**Files:**
- Modify: `ai-tools.html` — connect each existing ClipX tool to its working route and keep unimplemented tools labeled.
- Modify: `dashboard.html` and `scripts/shif-a-dashboard.js` — render real history/download/plan/credit data from Task 3.
- Modify: `admin.html` — preserve the existing support admin page and add only server-authorized SHIF-A operational views; do not expose customer-wide data to ordinary users.
- Create: `supabase/functions/shif-a-admin-summary/index.ts` — proposed admin-only operational summary endpoint if required by the approved admin scope.
- Modify: `README.md`, `privacy.html`, `terms.html`, `about.html`, and `contact.html` — update brand and product claims only after each corresponding feature is live and verified.
- Modify: `sitemap.xml` and SEO metadata after the final public routes are fixed.
- Create: `tests/test_shif_a_release_contract.py`.

**Interfaces:**
- Tool cards link to real pages/functions only when available; planned tools remain non-actionable or show a clear coming-soon state.
- Admin summary endpoint verifies `app_metadata.support_role = admin` server-side and returns only operational metrics needed for administration.
- Billing provider interface remains an adapter boundary: verified provider webhook -> server-side subscription state -> plan entitlement update. No provider is selected by this plan and no real charge flow is activated.

- [ ] **Step 1: Add focused failing release-contract tests**

Assert that ClipX links remain present; disabled cloud/paid generation guards remain unchanged; every active AI tool has a real route or endpoint; coming-soon tools cannot start a job or deduct credits; admin endpoints reject ordinary authenticated users; payment state cannot be changed by a browser-only request; sitemap contains only public pages; legal copy does not claim features or data flows that are not enabled.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_release_contract`

Expected: tests fail until tool status, admin authorization, payment boundaries, and legal/public route checks are connected.

- [ ] **Step 3: Integrate only verified capabilities**

Connect the existing ClipX browser tools and creator utilities to the unified navigation. Keep image, voice, writing, research, and automation cards in coming-soon state until their real implementations, privacy behavior, provider quotas, and error handling are verified. Preserve the current admin support workflow and add only server-authorized operational controls. Do not add customer credit adjustment controls without a server audit record and explicit role policy. Do not activate payment checkout or subscription mutation until a payment provider, webhook signature verification, refund/cancellation behavior, and the exact plan/price/credit matrix are approved. Update legal pages only for implemented data flows.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_release_contract`

Expected: legacy links and safeguards remain; unimplemented tools are clearly non-operational; admin and payment mutation paths fail closed; public sitemap and legal claims match deployed behavior.

- [ ] **Step 5: Run full integration and launch checks**

Run the GitHub Actions `Validate ClipX` workflow. Also test sign-up, sign-in, sign-out, session expiry, user A/user B data isolation, Android Chrome navigation, desktop layout, ClipX video preview/trim/export, caption/SRT workflows, history/download behavior, credit reserve/release/renewal, admin denial for non-admin users, and all public canonical/sitemap links. Test paid checkout only in provider sandbox after provider and pricing approval; no live charge is part of this plan.

Expected: all existing and new checks pass; any unsupported browser export or disabled provider feature displays a clear limitation rather than a false success.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add ai-tools.html dashboard.html scripts/shif-a-dashboard.js admin.html supabase/functions/shif-a-admin-summary README.md privacy.html terms.html about.html contact.html sitemap.xml tests/test_shif_a_release_contract.py
git commit -m "feat: integrate SHIF-A tools and admin boundaries"
```

## Unresolved Product Decisions

These decisions change visible behavior or backend contracts and must be settled before the affected implementation tasks begin:

1. **Brand clearance:** confirm trademark and domain clearance for SHIF-A AI before public launch or domain purchase.
2. **Membership matrix:** approve exact Free/Pro/Premium prices, monthly credits, tool entitlements, expiry/rollover rules, and usage limits. Until then, show plan descriptions without fabricated prices or credit quantities.
3. **AI provider selection:** choose each image, voice, writing, research, and automation provider, including region, privacy terms, quotas, latency, and cost. Keep tools marked coming soon until approved.
4. **Budget approval:** confirm a monthly ceiling and provider-side budget controls. Existing `BUDGET_GUARDRAILS.md` records an INR 1,000/month planning ceiling with allocations, but paid activation still requires the owner to review providers/terms and explicitly approve it.
5. **Payment provider:** select a provider and approve webhook, refund, cancellation, tax, and subscription lifecycle behavior before implementing live checkout.
6. **Monthly renewal policy:** choose renewal timezone/date, treatment of unused credits, expiry, failed renewal, and account cancellation behavior before enabling scheduled credit grants.
7. **Account migration:** confirm whether existing ClipX users retain the same login and how any legacy account/profile metadata maps into SHIF-A. Do not reset or merge accounts automatically.
8. **Admin authority:** confirm which admin roles can inspect support tickets, view aggregated usage, grant/refund credits, suspend accounts, or edit plans. Keep privileged mutations disabled until roles and audit requirements are approved.

## Handoff

This plan is a proposed implementation sequence, not a statement that the website has been changed. Begin with Task 1 only after reviewing this plan. Use the available inline task-by-task execution workflow; no subagent-driven implementation workflow has been confirmed in this environment.
