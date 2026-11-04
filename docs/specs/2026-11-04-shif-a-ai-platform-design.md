# SHIF-A AI Platform — Design Specification

**Date:** 2026-11-04  
**Repository:** `trademalikk-svg/clipx-ai-studio`  
**Status:** Design proposal for user review; no implementation included.

## 1. Product direction

Evolve the existing ClipX AI Studio website into one unified platform branded **SHIF-A AI**. The new SHIF-A AI homepage becomes the primary public entry point. The existing ClipX video-creation capabilities remain available as the **ClipX Video Studio** within the same website and customer account; they are not discarded or split into a separate site.

The SHIF-A AI name is a proposed brand identity only. Trademark, domain, and brand-conflict clearance have not been established and must be checked before a public rebrand or domain purchase.

## 2. Visual system

- Primary palette: Navy Blue, Electric Blue, and White.
- Supporting colors: restrained cool greys and accessible status colors.
- Style: clean, professional, premium SaaS; moderate use of gradients, subtle shadows, and rounded cards. Avoid excessive glow, clutter, and heavy animation.
- Responsive behavior: mobile-first layouts that also use available desktop width effectively.
- Navigation: consistent header on public pages; compact mobile navigation; authenticated workspace navigation after login.
- Accessibility: readable contrast, visible focus states, semantic headings, keyboard-operable controls, and labels for form inputs.

## 3. Unified website structure

### Public website
1. SHIF-A AI Home — premium hero, concise product explanation, featured tools, legacy ClipX feature entry, membership overview, FAQ/support links, and footer.
2. Explore AI Tools — searchable/categorized directory of available tools.
3. Pricing — Free and paid tiers only after prices, quotas, and provider costs are approved.
4. Resources / Guides — existing ClipX guides and creator resources retained where relevant.
5. About, Contact, Privacy Policy, and Terms & Conditions — update only when actual product behavior and data flows are confirmed.

### Authenticated customer workspace
1. Account/profile and settings.
2. Customer dashboard overview.
3. AI Tools directory and recent tools.
4. ClipX Video Studio, preserving existing working browser-side video tools.
5. Projects and generated-content history.
6. Downloads and exports.
7. Membership and monthly credit balance/ledger.
8. Payment and subscription management, only when a payment provider and server-side verification are configured.

### Admin workspace
A separate, access-controlled admin area for user support, tool availability, plan configuration, credit adjustments, and operational reporting. Admin authorization must be enforced server-side; hiding an admin link in the browser is not access control.

## 4. Legacy ClipX preservation

The current ClipX repository contains browser-side video selection/preview, trimming/splitting/export where browser codecs permit, subtitle/SRT tools, creator utilities, prompt drafting, and experimental tools. These must be audited individually before moving or relabeling them.

Preserve existing working behavior and routes where practical. Do not imply that semantic AI highlight selection, cloud rendering, cloud upload, or external video generation is operational: current project documentation says those capabilities are disabled, heuristic-only, or not deployed. Keep them marked experimental/coming soon until implemented and tested.

Do not increase the existing file-size ceiling or promise 10 GB support as part of this design. Browser/device memory, codecs, and backend capacity must be validated before changing limits.

## 5. AI tools and service boundaries

The platform may expose tool categories such as:
- Video Studio (existing ClipX capabilities)
- Image Studio
- Voice and Audio Studio
- Writing Studio
- AI Assistant / Research
- Automation

A category or card is not evidence that its tool is functional. Each tool must have a real, tested implementation and a clear status (available, limited, beta, or coming soon). Provider-backed generation must use server-side credentials and documented quotas. No paid provider, paid API, or billable infrastructure may be enabled without explicit budget approval. Do not expose secret keys in browser code.

## 6. Account, credits, membership, and payments

- Reuse the existing authentication system only after reviewing its current configuration and flows.
- A customer sees their account, plan, current credit balance, monthly allowance, and credit transaction history.
- Credit accounting must be server-authoritative, atomic, and auditable; never trust a client-supplied balance or usage amount.
- Monthly credit renewal must be implemented as a controlled backend process with idempotency and clear renewal dates.
- Free/Pro/Premium are proposed plan labels. Prices, included credits, tool access, rollover rules, and usage costs remain undecided and must not be fabricated.
- Payment status and subscription changes must be confirmed by verified provider webhooks/server-side checks, not by a browser success message.
- Until billing is configured and tested, show payment/subscription features as unavailable or clearly marked as not yet enabled.

## 7. Data flow and privacy

- Public visitors can browse public pages and tool descriptions.
- Authenticated users access only their own profile, projects, generated content, downloads, and credit history.
- Admin operations require a separate server-verified role/permission check.
- Store only data required for the feature; document retention and deletion behavior.
- Update Privacy Policy and Terms to match the actual implemented data flows before launch.
- Do not upload private media to cloud services unless the user is clearly informed and has chosen that workflow.

## 8. Error handling and user feedback

- Show clear loading, success, empty, and error states for login, generation, uploads, exports, history, credits, and billing.
- If an AI provider is unavailable or quota is exhausted, explain the issue and avoid charging credits for failed work.
- If an export is unsupported by the browser/device, explain the limitation and offer supported formats where available.
- Never show fabricated progress, generated outputs, payment success, credit deductions, or subscription status.

## 9. Implementation phases

1. **Foundation and rebrand shell:** responsive SHIF-A AI public homepage, global navigation, consistent design tokens, and preserved ClipX entry point.
2. **Customer workspace:** authentication review, dashboard shell, profile, projects/history, and download organization.
3. **Tool integration:** migrate/organize verified ClipX tools and add new AI tools one at a time with real provider/backend integration.
4. **Credits and memberships:** backend credit ledger, plan entitlements, and monthly renewal rules.
5. **Payments and admin:** verified billing integration and protected admin operations.
6. **Launch readiness:** accessibility, mobile/desktop QA, browser compatibility, security review, privacy/terms review, and deployment checks.

Each phase should be separately tested and deployed. Avoid a large all-at-once replacement of the current homepage.

## 10. Acceptance criteria

- One website and one customer account experience; ClipX is a video studio inside SHIF-A AI.
- Existing verified ClipX functionality remains usable after the homepage/navigation transition.
- Home page and customer workspace consistently use Navy Blue + Electric Blue + White.
- Mobile and desktop layouts are usable without horizontal overflow.
- Customer data is isolated by authenticated user; admin permissions are enforced server-side.
- Credits and payments are never represented as live until backend verification exists.
- Tool status labels accurately distinguish working, limited, beta, and coming-soon features.
- No paid services are activated without explicit approval.
- Existing SEO redirects/canonicals, privacy disclosures, and legal pages are reviewed before the public rebrand.
- GitHub Actions checks and relevant browser/device tests pass before declaring a phase complete.

## 11. Out of scope for this design approval

- Implementing or enabling new AI providers.
- Setting actual subscription prices or monthly credit quantities.
- Purchasing domains or making trademark/legal claims.
- Enabling paid cloud rendering, storage, generation, or payment services.
- Promising unlimited usage, 10 GB processing, or global-scale capacity without validated infrastructure.

---

**Review note:** This document defines the intended product and design direction only. It does not claim that any new page, dashboard, AI tool, billing flow, or backend feature has been implemented.
