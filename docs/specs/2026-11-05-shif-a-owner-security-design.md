# SHIF-A AI Owner Security Design

**Date:** 2026-11-05  
**Status:** Proposed design for user review  
**Scope:** Owner-only authentication, biometric/passkey login, and account recovery. This document does not authorize production deployment or database changes.

## Goals

- Protect the SHIF-A Owner account with strong authentication.
- Allow the Owner to sign in quickly on a previously registered device using its supported biometric or device screen-lock verification.
- Keep biometric templates and raw biometric data on the user's device; SHIF-A must never collect or store fingerprints, face scans, iris images, or retina images.
- Provide a secure recovery route if the Owner forgets the Owner ID or password, loses a device, or cannot use biometrics.
- Enforce Owner privileges on trusted servers, never from browser UI state or user-editable metadata.

## Owner sign-in

1. First-time enrollment requires a trusted, manually authorized Owner bootstrap. An email address alone must never grant Owner privileges.
2. Initial passkey enrollment happens only after the Owner signs in using the existing verified account credentials and completes MFA.
3. The Owner registers a discoverable WebAuthn passkey (resident credential) on the device, with user verification required.
4. **Direct passkey sign-in (selected):** On later visits, the Owner can choose “Owner Passkey Login” without entering an email or password. The server issues a discoverable-credential challenge; the browser invokes WebAuthn with no account identifier; the verified credential ID and user handle map to the pre-enrolled Owner account. The server checks the private Owner membership record and only then creates a short-lived Supabase magic-link token using the server-side Admin API. The browser exchanges that one-time token hash with Supabase Auth to establish the normal Supabase session. The token hash is never returned before successful passkey verification, is single-use, and is not logged.
5. The Supabase session is therefore still issued by Supabase Auth; SHIF-A never fabricates JWTs or stores user passwords.
6. The Owner registers a WebAuthn passkey on the device. The browser/operating system may offer fingerprint, face recognition, or device PIN/pattern/password according to device capability.
7. On success, the server validates the assertion, checks the Owner membership and returns the one-time Supabase handoff token described above.
8. If biometric verification is unavailable, the OS may use its supported screen-lock method. New devices require full account authentication and MFA before a new passkey can be enrolled.

**Important capability boundary:** A website cannot demand fingerprint specifically on every device. WebAuthn authenticates possession of a registered authenticator and user verification; the operating system decides whether that verification uses fingerprint, face, PIN, or another supported method. A website does not receive the biometric itself.

## Eye / iris / retina verification

- SHIF-A will not implement camera-based eye scanning or claim that an ordinary phone camera performs a retina scan.
- Eye or iris verification is available only indirectly if the device operating system exposes it as a supported platform authenticator method through WebAuthn.
- SHIF-A cannot reliably distinguish whether the operating system used fingerprint, face, iris, or device PIN; the OS controls that choice.
- If the Owner's device does not support eye/iris authentication, the option is unavailable and the Owner uses a passkey with another supported verification method or MFA.

## Forgot Owner ID / password and recovery

- Provide clearly labelled **Forgot Owner ID** and **Forgot Password** entry points.
- Recovery must verify control of the already registered account recovery channel and require an additional factor or pre-generated recovery code, depending on the recovery scenario.
- A registered passkey may help identify/authenticate an account only if it was created as a discoverable credential and the browser/authenticator supports that flow. It is not a universal recovery mechanism.
- Generate one-time recovery codes during secure enrollment. Display them once, ask the Owner to store them safely, and store only salted/hashed verifiers server-side. Each code can be used once.
- If the Owner loses all authenticators and recovery codes, use a separately documented manual identity verification and administrator-controlled recovery procedure. Never bypass MFA merely because someone knows the Owner ID or email address.
- After recovery, revoke lost passkeys, active sessions, and refresh tokens; notify the verified account channel; record the event in the audit log.

### Final fallback: Owner-entered “Lover Name”

- Place an optional **Lover Name** field at the very end of the recovery options, after the normal account, passkey, recovery-code, and verified-channel methods have failed or are unavailable.
- The Owner enters the value personally during a trusted, authenticated setup. SHIF-A must not prefill, guess, suggest, or invent the name.
- Treat it only as a supplementary recovery check, never as a password, standalone proof of identity, or a way to bypass verified-channel/MFA requirements. A name can be guessed or discovered.
- Do not display the saved answer again. Store only a salted, purpose-specific verifier; apply strict rate limits, generic failure messages, audit logging, and recovery notifications.
- The field is optional. The Owner may leave it unset; the standard recovery routes must continue to work.

## Server-side authorization

- The server obtains the authenticated user identity from Supabase Auth and checks a private, server-controlled Owner membership record.
- Never grant Owner privileges from client-side flags, URL parameters, local storage, editable user metadata, or email-address matching alone.
- Owner-only API routes and database operations independently verify Owner authorization on every request.
- Keep service-role secrets server-side only. Apply least privilege and Row Level Security to customer data.
- Require recent re-authentication/MFA for high-impact actions such as changing Owner credentials, inviting privileged users, changing security settings, or exporting sensitive data.

## Audit, alerts, and abuse controls

- Record security-relevant events: successful/failed sign-ins, MFA changes, passkey registration/removal, recovery attempts/completion, session revocation, Owner privilege changes, and high-impact administrative actions.
- Store timestamps, event type, outcome, and minimal useful context. Avoid logging passwords, tokens, recovery codes, or biometric data.
- Apply rate limits and progressive delays to authentication and recovery endpoints. Avoid account-enumeration responses.
- Notify the Owner through the verified recovery channel about new authenticator enrollment, recovery, and suspicious sign-in events.
- Provide a session/device list and a way to revoke individual sessions and passkeys.

## User guidance

The Owner will receive a Hindi, mobile-first setup guide covering:
1. First Owner sign-in and MFA setup.
2. Registering a passkey on Android/Chrome.
3. Using fingerprint or another device-supported verification for subsequent sign-ins.
4. Storing and using recovery codes.
5. Reviewing active sessions and removing a lost device.
6. Recovering the Owner ID or password safely.

The guide must explain that the fingerprint/face/iris data remains under Android/OS control and is not sent to SHIF-A.

## Testing and acceptance criteria

- Customer accounts cannot access Owner pages or Owner APIs.
- Owner authorization fails closed if the server-side membership lookup is unavailable.
- An unregistered device cannot enroll a passkey without full authentication and MFA.
- A registered passkey succeeds only after server-side WebAuthn challenge and assertion validation.
- Unsupported browsers/devices show a clear fallback rather than a fake biometric prompt.
- Recovery codes are one-time and cannot be replayed.
- Recovery revokes lost credentials and sessions.
- Authentication and recovery endpoints resist brute-force attempts and account enumeration.
- Audit logs contain no secrets or biometric material.
- Test Android Chrome, desktop browsers, passkey-capable devices, and fallback cases.

## Out of scope for this phase

- Applying SQL migrations to Supabase.
- Deploying or changing production Edge Functions.
- Enrolling or granting the Owner role to any account.
- Enabling payments or paid authentication providers.
- Camera-based retina/iris recognition.
- Claiming the system is impossible to hack or 100% secure.

## Implementation boundary

This is a design specification only. Implementation requires a separate reviewed plan, changes on the existing development branch, automated tests, security review, and explicit approval before any production migration or deployment.
