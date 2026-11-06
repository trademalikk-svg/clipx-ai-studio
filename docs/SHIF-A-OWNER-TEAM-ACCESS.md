# SHIF-A AI — Owner and Team Access Design

Status: design and schema draft only. This document does not activate team access.

## Product rule
- The project creator remains the immutable project owner (shif_a_projects.user_id).
- Owner has no SHIF-A subscription charge and is not subject to product-level member quotas.
- Owner access does not mean unlimited third-party compute, model API, network, or storage. Provider limits and configurable safety caps still apply.
- Invited accounts receive only the project role and quotas assigned by the owner.
- No billing, paid provider activation, or spending action is enabled by this design.

## Roles
- admin: manage project members and project settings; edit project content.
- editor: create and update project content and files; cannot invite or change roles.
- ai_user: use AI features within assigned message/context quotas; cannot manage members.
- viewer: read-only access to explicitly shared project resources.

The owner is not a selectable membership role. A client cannot promote itself to owner.

## Invitation lifecycle
1. Owner requests an invitation for a verified email and selects a non-owner role and limits.
2. A trusted server-side function generates a cryptographically random, single-use token, stores only its hash, and sets an expiry.
3. The recipient signs in and accepts the invitation using the token. The server verifies email, expiry, unused status, and project state, then consumes it atomically.
4. Owner can revoke membership. All changes are audited.
5. No service-role key or invitation secret is ever sent to browser code.

## Initial default limits
- AI messages: 30 per rolling 24 hours per invited user/project.
- File storage: 100 MiB per invited user/project.
- Maximum individual upload: 10 MiB.
- Context attachment: 128 KiB per prompt (existing chat limit).

These are product limits, not guarantees of provider cost. The backend must enforce them; UI-only counters are not security controls.

## Rollout gates
- SQL migrations remain unapplied until explicit approval.
- Invitation Edge Function must be deployed and tested before invite UI is enabled.
- RLS must be tested for owner, each member role, revoked users, expired invitations, and cross-project access.
- No production deployment or migration application is performed by this draft.
