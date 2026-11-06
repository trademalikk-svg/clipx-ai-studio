# SHIF-A AI Main Workspace & Shared Project OS

**Date:** 2026-11-05  
**Status:** Draft for user review  
**Branch:** `shif-a-main-workspace-design`  
**Scope:** Main AI Command Center, shared project model, navigation, tool routing, and user-facing guide. This specification does not authorize production deployment, database migration, billing changes, or merging.

## 1. Product direction

Combine:
- **A — Simple Projects:** low-friction project creation, chat, and files.
- **C — AI Project OS:** shared context across tools, activity timeline, task state, version history, and permissioned agent workflows.

The result should feel like one coherent workspace, not a collection of unrelated tool links. Keep the interface mobile-first for Android Chrome while scaling to desktop.

## 2. Main Workspace information architecture

### Global shell
- Top bar: SHIF-A brand, global search/command shortcut, notifications, help, account menu.
- Left navigation: Home, AI Chat & Research, Coding Studio, Website/App Builder, Image Studio, Video Studio, Voice Studio, Writing & Documents, Business & Marketing, Education & Productivity, Agents & Automation, My Projects, Files, Settings.
- Main canvas: current workspace view.
- Context panel: collapsible right-side panel on desktop; bottom sheet/drawer on mobile. Shows project context, recent files, activity, and task status.
- Mobile: compact top bar, slide-out navigation drawer, full-width content, bottom action area for primary command input. Avoid three-column layout on narrow screens.

### Home / Command Center
- Welcome header and account/workspace state.
- Universal AI Command Box with prompt, attachment affordance (only for supported file types), mode selector, and submit action.
- Suggested actions and recently opened projects.
- Tool launch cards with explicit availability states: Available, Limited, Coming Soon.
- Recent activity and project list.
- No fabricated model response, generation progress, or completion status.

### Universal command behavior
- **Auto:** classify the request and recommend a tool. If confidence is low or the action is consequential, ask a concise clarification before running.
- **Manual:** user selects a department/tool before submitting.
- **Project:** command runs in the context of a selected project and may use only files/context the user has permission to access.
- Before any external, destructive, publish, or paid action, show a review/confirmation step. No silent publishing, purchases, deployments, or deletion.
- If the required provider/backend is not configured, explain the limitation and offer a real available alternative.

## 3. Shared Project OS

### Project lifecycle
- Create project with title, optional description, and category.
- Open, rename, archive, and delete with confirmation. Deletion must explain scope and be recoverable where technically supported.
- Project home shows overview, current tasks, recent activity, linked chats, files, and outputs.
- Projects are private to their owner by default. Sharing/collaboration is a later permissioned capability, not assumed.

### Shared context
- A project can contain multiple tool sessions: chat/research, coding, writing, image/video/voice tasks, and agent runs.
- Each session records tool type, timestamps, status, input/output references, and relevant project context.
- Context handoff must be explicit and scoped. A tool should not silently ingest every file or unrelated conversation.
- Users can inspect and remove linked context where supported.

### Files and versions
- Store file metadata separately from file bytes; enforce per-user/project authorization on every read/write.
- Track filename, MIME type, size, owner, project, created time, source tool, and version.
- Validate upload size/type server-side; do not trust browser-provided metadata.
- Provide preview/download only for supported safe formats. Do not execute uploaded files.
- Version history is append-oriented; restore creates a new version rather than silently overwriting history.

### Activity and tasks
- Activity timeline records project creation, file add/remove, tool runs, status transitions, exports, and sharing changes.
- Task states: Draft, Queued, Running, Needs Review, Completed, Failed, Cancelled.
- Only mark a task Running after the backend confirms it started; only mark Completed after output is persisted and verified.
- Retry must be idempotent where possible and clearly show duplicate-risk for non-idempotent actions.

## 4. Tool directory and availability truthfulness

Use one central tool registry for display metadata and routing. Each tool entry includes stable ID, category, description, availability state, route, required capability/provider, and help-guide anchor.

Current known tool states from the existing directory:
- Available: ClipX Video Studio, Video Prompt Builder, Titles & Hashtags.
- Limited: Thumbnail Creator, AI Coding Studio (local templates/editor/preview/export; no model-backed generation or APK compilation).
- Coming Soon: AI Chat & Research model backend, Image generation backend, Voice generation backend, AI Writing, Agents, Automation, Documents/PDF, Business, Education, Productivity.

Do not upgrade a state until its end-to-end flow is tested against the real backend.

## 5. User experience and accessibility
- Navy base, electric-blue accents, white/high-contrast text, restrained purple highlights.
- Clear focus states, keyboard access, semantic landmarks, labelled controls, live status announcements, reduced-motion support.
- Mobile tap targets at least 44px where practical.
- Empty states explain what can be done next; errors explain recovery actions.
- Hindi and English UI copy; user guide starts in Hindi.

## 6. Security and privacy boundaries
- Reuse existing Supabase authentication; do not replace or weaken Owner Security.
- Server-side authorization and database Row Level Security are mandatory for projects, files, task history, and owner controls.
- Never trust client-side role flags, project IDs, filenames, or tool availability as authorization.
- Secrets and service-role credentials remain server-side.
- Do not store API keys, passwords, recovery codes, or biometric data in project files, browser storage, logs, or analytics.
- Owner-only controls remain hidden in UI and independently enforced by server endpoints.
- No production SQL migration, Edge Function deployment, passkey activation, PR merge, or publishing without separate explicit approval.

## 7. Phased delivery

### Phase 1 — Workspace shell
Responsive navigation, Home/Command Center, tool registry display, guide entry points, and links to existing tools. No claim of a connected AI chat backend.

### Phase 2 — Project foundation
Project CRUD and authorization design, project overview, shared metadata model, task/activity schema, and file metadata model. Apply database changes only after review and explicit approval.

### Phase 3 — Real tool integration
Connect existing available/limited tools to projects, persist task status/output references, and verify end-to-end flows.

### Phase 4 — AI providers and agents
Add provider adapters with explicit quota/cost boundaries, scoped context permissions, review gates, and safe retry behavior.

### Phase 5 — Collaboration and advanced OS features
Sharing, team roles, version restore, agent orchestration, and automation after access controls and audit trails are verified.

## 8. Acceptance criteria
- Android Chrome and desktop navigation work without horizontal overflow.
- Every visible tool has a truthful availability state and correct destination.
- Universal command supports Auto/Manual/Project UI modes; unavailable backend produces a clear non-fake explanation.
- Project context never crosses user boundaries.
- Project files cannot be read by changing a URL or project ID.
- Task state transitions reflect backend-confirmed events.
- User can find a Hindi guide from every major workspace section.
- Existing login, dashboard, Owner Security, and current tool routes continue to work.
- Automated checks cover links, IDs, JavaScript syntax, responsive layout smoke tests where available, and authorization tests when backend exists.

## 9. Open implementation decisions
- Select the actual project database schema and storage bucket policies during the implementation plan, after inspecting current Supabase schema and existing migrations.
- Select provider adapter(s) only after checking free-tier quotas, data handling, and terms. No paid provider is assumed.
- Define upload limits from actual storage/inference constraints; do not promise unlimited files or compute.
- Define collaboration and sharing separately; Phase 1 remains private-by-default.

## 10. Review gate
This document is a design proposal. User review and approval are required before writing the implementation plan. After plan approval, code changes may proceed on this feature branch. Production migrations, deployments, and merge remain separate approval gates.
