# SHIF-A AI Owner Security Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Owner-only passkey-based sign-in, MFA-aware account recovery, server-authoritative Owner authorization, and auditable security controls without collecting biometric data.

**Architecture:** Keep Supabase Auth as the identity/session authority and private membership records as the Owner-role authority. Add WebAuthn passkey registration and assertion verification through trusted server endpoints with short-lived, single-use challenges; the device/OS performs fingerprint, face, iris, or screen-lock verification and SHIF-A receives only cryptographic WebAuthn results. Recovery uses verified account channels and one-time hashed recovery codes, with session/credential revocation and audit events.

**Tech Stack:** Existing static HTML/CSS/JavaScript frontend, Supabase Auth, Supabase Edge Functions (Deno/TypeScript), PostgreSQL private schema/RPC, Python unittest contract tests, Node syntax checks, Deno type checks, GitHub Actions.

## Global Constraints

- Owner privileges are read from a private server-controlled membership record; never infer Owner from email address, client state, URL parameters, local storage, or editable user metadata.
- Biometric templates, fingerprint images, face images, iris images, and retina images must never be collected or stored by SHIF-A.
- A browser cannot force fingerprint specifically. WebAuthn user verification may be performed by the OS using fingerprint, face, PIN, pattern, or device password according to device capability.
- Ordinary phone cameras must not be represented as retina scanners. Iris/eye verification is available only if the platform authenticator exposes it; SHIF-A cannot reliably identify which modality the OS used.
- First-time Owner bootstrap remains a separately trusted administrative operation; no account is promoted based only on an email string.
- Service-role secrets remain server-side. All privileged endpoints fail closed if authentication or membership verification fails.
- Do not apply SQL migrations or deploy Edge Functions to production as part of branch implementation. Production rollout requires a separate explicit approval.
- Preserve existing ClipX authentication, free-mode safeguards, dashboard, tools catalog, and Coding Studio.
- Provide a Hindi, mobile-first usage guide explaining setup, login, recovery, and device revocation.
- Put an optional Owner-entered **Lover Name** check at the very end of recovery options. The Owner supplies the value during trusted setup; never prefill or invent it. It is a weak supplementary check only, never standalone authentication or an MFA/verified-channel bypass. Store only a salted verifier, do not reveal the saved value, rate-limit attempts, audit attempts, and notify the verified channel. If unset, normal recovery remains available.
- Never claim 100% unhackable security.

---

### Task 1: Server-authoritative Owner security foundation

**Files:**
- Modify: `supabase/shif_a_access_foundation.sql`
- Modify: `supabase/functions/shif-a-access/index.ts`
- Create: `supabase/functions/shif-a-security-audit/index.ts` (proposed)
- Test: `tests/test_shif_a_access_contract.py`
- Test: `tests/test_shif_a_owner_security_contract.py` (proposed)

**Interfaces:**
- Existing: `public.shif_a_get_membership(p_user_id uuid)`
- Existing: authenticated `GET /functions/v1/shif-a-access`
- New: authenticated security event writer accepting a fixed allow-list of event types and minimal metadata; actor identity is derived from the verified JWT, never accepted from request JSON.

- [ ] **Step 1: Add failing contract tests**

Assert that private security tables have RLS enabled; no browser roles receive direct table access; Owner authorization uses the private membership lookup; audit event actor IDs are server-derived; event types are allow-listed; request payload cannot supply actor identity, secrets, tokens, or biometric material.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_owner_security_contract`

Expected: tests fail because the security audit schema and endpoint contract are not present.

- [ ] **Step 3: Implement the minimum behavior**

Add private tables for WebAuthn credential metadata, one-time challenges, hashed recovery-code verifiers, and security audit events. Store credential IDs, public keys, sign counters/backup flags as required by the chosen WebAuthn library; never store biometric samples. Add indexes, expiry fields, unique constraints, and restrictive grants. Add fixed-purpose service-role-only RPCs for atomic challenge consumption, credential registration/update/removal, recovery-code consumption, and audit insertion. Update access endpoint to keep its current fail-closed membership behavior and return only safe Owner security capability metadata. Add a small audit Edge Function that authenticates the caller, derives user ID from `auth.getUser(token)`, verifies Owner membership for Owner-only events, validates a strict event allow-list, and writes minimal metadata.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_owner_security_contract tests.test_shif_a_access_contract`

Expected: all focused schema and endpoint contract tests pass.

- [ ] **Step 5: Run affected integration checks**

Run: `deno check supabase/functions/shif-a-access/index.ts supabase/functions/shif-a-security-audit/index.ts`

Expected: both Edge Functions type-check; no service-role key is referenced by browser files.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add supabase/shif_a_access_foundation.sql supabase/functions/shif-a-access/index.ts supabase/functions/shif-a-security-audit/index.ts tests/test_shif_a_access_contract.py tests/test_shif_a_owner_security_contract.py
git commit -m "feat: add owner security data foundation"
```

### Task 2: Owner passkey registration and direct sign-in

**Files:**
- Create: `supabase/functions/shif-a-passkey/index.ts` (proposed)
- Create: `scripts/shif-a-passkey.js` (proposed)
- Modify: `dashboard.html`
- Modify: `scripts/shif-a-dashboard.js`
- Modify: `.github/workflows/validate.yml`
- Test: `tests/test_shif_a_owner_passkey_contract.py` (proposed)

**Interfaces:**
- Authenticated endpoints: `POST /functions/v1/shif-a-passkey` with actions `registration-options`, `registration-verify`, `authentication-options`, `authentication-verify`, and `revoke`.
- Browser module exposes `ShifAOwnerPasskey.isSupported()`, `register()`, `signIn()`, and `revoke(credentialId)`.
- The implementation must use a maintained Deno-compatible WebAuthn server library pinned to an explicit version; exact package selection is an engineering decision to verify against Deno compatibility before coding.

- [ ] **Step 1: Add failing contract tests**

Assert registration/authentication require verified Supabase sessions and server-side Owner membership; challenges are random, short-lived and single-use; RP ID/origin are fixed to the deployed site; verification validates challenge, origin, RP ID, user presence and user verification; credentials are bound to the authenticated Owner; non-Owner and unregistered devices receive 403/401; replayed assertions fail; no biometric fields are accepted or stored.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_owner_passkey_contract`

Expected: tests fail because passkey endpoints and browser module do not exist.

- [ ] **Step 3: Implement the minimum behavior**

Implement registration options only for a verified Owner session with recent MFA; store pending challenge server-side with expiry and atomic one-time consumption. Verify registration server-side and persist public credential metadata. Implement discoverable/known-credential authentication options and assertion verification; validate exact allowed origin and RP ID, challenge, signature, credential ownership, user presence and user verification. Issue the authenticated application session only after successful server verification. Browser code uses `navigator.credentials.create/get`, feature detection, clear unsupported-browser fallback, and no biometric access APIs. Add UI to register, sign in with, list, and revoke Owner passkeys. On Android, the OS may prompt for fingerprint or another supported device verification; the website must not claim it can force fingerprint.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_owner_passkey_contract` and `node --check scripts/shif-a-passkey.js`

Expected: passkey contract tests and browser script syntax pass.

- [ ] **Step 5: Run affected integration checks**

Run: `deno check supabase/functions/shif-a-passkey/index.ts`

Expected: endpoint type-checks with pinned WebAuthn dependency and no secret exposed to the client.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add supabase/functions/shif-a-passkey/index.ts scripts/shif-a-passkey.js dashboard.html scripts/shif-a-dashboard.js .github/workflows/validate.yml tests/test_shif_a_owner_passkey_contract.py
git commit -m "feat: add owner passkey authentication"
```

### Task 3: Owner ID/password recovery and emergency account recovery

**Files:**
- Create: `supabase/functions/shif-a-owner-recovery/index.ts` (proposed)
- Create: `scripts/shif-a-owner-recovery.js` (proposed)
- Modify: `dashboard.html`
- Modify: `supabase/shif_a_access_foundation.sql`
- Test: `tests/test_shif_a_owner_recovery_contract.py` (proposed)

**Interfaces:**
- Recovery endpoints: `POST /functions/v1/shif-a-owner-recovery` with actions `request-id-recovery`, `request-password-reset`, `consume-recovery-code`, `verify-final-fallback`, and `revoke-lost-authenticator`.
- Browser module exposes `requestOwnerIdRecovery()`, `requestPasswordReset()`, `consumeRecoveryCode(code)`, and `revokeLostAuthenticator(credentialId)`.

- [ ] **Step 1: Add failing contract tests**

Assert recovery responses do not reveal whether an account exists; codes are high-entropy, stored only as salted/hashed verifiers, expire, and can be consumed once; invalid/replayed/expired codes fail; recovery requires the registered verified channel and additional verification; the optional final Lover Name value is entered by the Owner, stored only as a salted verifier, never returned to the browser, rate-limited, audited, and cannot authorize recovery by itself; successful recovery revokes selected lost passkeys and active sessions/refresh tokens where supported; every attempt creates a minimal audit event.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_owner_recovery_contract`

Expected: tests fail because recovery endpoint and recovery-code schema do not exist.

- [ ] **Step 3: Implement the minimum behavior**

Add one-time recovery codes generated only after authenticated Owner enrollment; display them once with Hindi instructions to store offline. Persist only salted/hashed verifiers. Use Supabase's supported verified email password-reset flow for password resets and generic responses to prevent account enumeration. Owner ID recovery returns or delivers the ID only through the previously verified recovery channel after successful verification. Require recent MFA or an unused recovery code to revoke a lost passkey. Implement the optional Lover Name as the final supplementary check only; the Owner supplies it during trusted setup, it is never prefilled or displayed later, only a salted verifier is stored, and it must never replace verified-channel/MFA/recovery-code proof. Revoke sessions using supported Supabase Auth administrative capabilities from the server, then require fresh authentication. For loss of all authenticators and codes, provide a documented manual verification process; do not add an email-only MFA bypass. Camera-based retina/iris scanning is explicitly not implemented.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_owner_recovery_contract`

Expected: recovery tests pass, including replay and expiry rejection.

- [ ] **Step 5: Run affected integration checks**

Run: `deno check supabase/functions/shif-a-owner-recovery/index.ts`

Expected: recovery endpoint type-checks; logs contain no recovery codes or tokens.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add supabase/functions/shif-a-owner-recovery/index.ts scripts/shif-a-owner-recovery.js dashboard.html supabase/shif_a_access_foundation.sql tests/test_shif_a_owner_recovery_contract.py
git commit -m "feat: add owner account recovery"
```

### Task 4: Owner security center, user guide, and end-to-end verification

**Files:**
- Create: `owner-security.html` (proposed)
- Create: `scripts/shif-a-owner-security.js` (proposed)
- Create: `docs/guides/shif-a-owner-security-hi.md` (proposed)
- Modify: `.github/workflows/validate.yml`
- Modify: `sitemap.xml` only if the security guide is intended to be public; private Owner pages must remain noindex and excluded.
- Test: `tests/test_shif_a_owner_security_ui.py` (proposed)

**Interfaces:**
- Security center consumes `ShifAAuth.getSession()`, server-verified access profile, and the passkey/recovery browser modules.
- UI displays registered passkeys by safe label/date, recovery-code setup status, recent security events, and session revocation actions; it never displays private key material or stored recovery codes.

- [ ] **Step 1: Add failing UI/guide contract tests**

Assert Owner security page is noindex, requires server-verified Owner role, customer access is denied, passkey/recovery controls are labelled in Hindi, biometric limitations are explained, and no private security page is listed in the public sitemap.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_owner_security_ui`

Expected: tests fail because the security center and Hindi usage guide do not exist.

- [ ] **Step 3: Implement the minimum behavior**

Build a responsive Owner-only security center with sections for passkey enrollment/removal, recovery-code setup status, recovery actions, recent audit events, and session/device revocation. Add a step-by-step Hindi guide for first setup, daily fingerprint/passkey sign-in, supported OS biometric alternatives, password/Owner ID recovery, storing recovery codes, and lost-device response. Keep unsupported Eye/Iris/Retina methods visibly unavailable rather than simulating a scan. Provide accessible status/error messages and never imply an action succeeded until the server confirms it.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_owner_security_ui`

Expected: UI and documentation contracts pass.

- [ ] **Step 5: Run complete repository validation**

Run: `python3 -m unittest discover -s tests -p 'test_shif_a_*.py'`, `node --check scripts/shif-a-passkey.js`, `node --check scripts/shif-a-owner-recovery.js`, `node --check scripts/shif-a-owner-security.js`, and Deno checks for all changed Edge Functions.

Expected: all focused and existing SHIF-A tests pass; GitHub Actions validation passes on the development branch.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add owner-security.html scripts/shif-a-owner-security.js docs/guides/shif-a-owner-security-hi.md .github/workflows/validate.yml tests/test_shif_a_owner_security_ui.py sitemap.xml
git commit -m "feat: add owner security center and Hindi guide"
```

---

## Unresolved implementation decisions

1. **Owner ID format and delivery:** The current project uses Supabase email/password identity. Decide whether Owner ID is a separate public username mapped to the verified Supabase user, or whether the verified email remains the login identifier and Owner ID is a recovery/display alias. Recommendation: keep Supabase email as the authentication identifier initially; add a separate non-secret Owner ID alias only if product UX requires it.
2. **Passkey account discovery:** Decide whether to support discoverable passkey sign-in from the Owner login screen before an email is entered, or require Owner ID/email first and then offer the passkey. Recommendation: require Owner ID/email first for the initial release; it simplifies account selection and avoids exposing account enumeration.
3. **Recovery channel:** Confirm which verified recovery channel(s) the Owner can access and whether a separate recovery email should be enrolled. No address is assumed in this plan. The optional Lover Name fallback is user-entered during trusted setup and remains supplementary only.
4. **Eye/iris:** No dedicated eye scanner will be built for ordinary phones. Support is limited to whatever modality the device OS performs behind WebAuthn user verification.
5. **Session revocation semantics:** Confirm whether recovery should revoke all sessions on every device or allow the Owner to preserve the current trusted session. Recommendation: revoke all sessions after password/account recovery; allow selective session revocation for a lost device when the platform supports it.
6. **Deployment approval:** SQL migration, Edge Function deployment, and Owner bootstrap are separate production actions and require explicit approval after branch tests and security review.
