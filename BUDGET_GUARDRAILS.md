# ClipX Hybrid Mode — Monthly Budget Guardrails

## Approved planning ceiling
Total target ceiling: INR 1,000 per calendar month across hosting/cloud video processing and both AI features.

| Cost centre | Monthly allocation |
|---|---:|
| Cloud processing and hosting | INR 500 |
| AI Highlights | INR 250 |
| AI Video Generation | INR 250 |
| **Total** | **INR 1,000** |

## Enforcement requirements before any paid activation
- Paid providers remain disabled by default.
- Never put provider credentials, Supabase service-role keys, or other secrets in browser code or the public repository.
- Before a paid job starts, the server must estimate its maximum charge and reserve that amount against the current month's ledger in one atomic database transaction.
- Reject new paid jobs if the reservation would exceed the relevant category allocation or the INR 1,000 overall ceiling.
- Release unused reservations after completion/cancellation; record actual provider-reported charges.
- Fail closed when pricing is unknown, usage metering is unavailable, or the ledger cannot be reached.
- Add provider-side budget alerts/limits as a second control. Application quotas alone are not a guaranteed INR cap; delayed billing, taxes, storage, bandwidth, and provider rounding can create additional charges.
- Do not activate paid processing until an adult account owner has selected the providers, reviewed their pricing/terms, configured provider-side billing controls, and explicitly approved activation.

## Current implementation status
This file records the agreed budget policy; it does not create a provider billing cap. Cloud processing, semantic AI highlights, and AI video generation remain disabled until their providers, server deployment, pricing, metering, and budget enforcement are configured and tested. Existing browser-side tools and heuristic highlights are not equivalent to those paid cloud features.

## Current known platform ceiling
The existing ClipX upload backend is configured for a maximum input size of 2 GiB, not 10 GB. Do not advertise 10 GB support until storage, processing, and egress limits are upgraded and tested.
