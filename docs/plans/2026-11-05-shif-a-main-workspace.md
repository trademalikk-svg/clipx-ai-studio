# SHIF-A Main Workspace Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a responsive SHIF-A AI Command Center that connects the existing truthful tool directory with a private-by-default shared project workspace and an in-product Hindi guide.

**Architecture:** Preserve the current static HTML/vanilla JavaScript structure and Supabase authentication. Build the first independently useful milestone as a responsive workspace shell with a central tool registry, command routing preview, project UI states, and guide navigation; do not fabricate AI execution or persist project data until an authorized backend schema and RLS policy are reviewed. Follow-on work adds project persistence only after database inspection and explicit migration approval.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, existing Supabase JS v2 client, Python unittest contract tests, Node.js 22 syntax checks, GitHub Actions.

## Global Constraints

- Combine A (simple project experience) and C (advanced AI Project OS) in the product direction.
- Mobile-first for Android Chrome; desktop may use a three-panel layout.
- Keep navy base, electric-blue accents, white/high-contrast text, restrained purple highlights.
- Keep existing authentication, Owner Security, and tool routes working.
- Tool availability must remain truthful: Available, Limited, or Coming Soon.
- Never claim model-backed AI, persistence, uploads, task execution, or completion unless the relevant backend confirms it.
- Project access must be private by default and enforced server-side with database Row Level Security.
- Never trust client-side roles, project IDs, filenames, or tool status as authorization.
- Do not store secrets, passwords, recovery codes, or biometric data in project data, browser storage, logs, or analytics.
- No production SQL migration, Edge Function deployment, passkey activation, PR merge, or publishing without separate explicit approval.
- The current repository has no package.json; existing CI runs `python3 -m unittest discover -s tests -p 'test_shif_a_*.py'`, inline JavaScript syntax checks, route/link/ID checks, and Deno Edge Function type checks.

---

### Task 1: Responsive Main AI Command Center shell

**Files:**
- Create: `workspace.html`
- Create: `scripts/shif-a-workspace.js`
- Create: `tests/test_shif_a_workspace.py`
- Modify: `scripts/shif-a-tools.js` only if a shared registry export is required; preserve existing IDs and destinations.
- Modify: `.github/workflows/validate.yml` to include the new page in page/route checks only if the current checks require an explicit list.

**Interfaces:**
- Consumes: existing tool catalogue currently declared in `scripts/shif-a-tools.js`; existing auth API `window.ShifAAuth.requireSession()`, `getAccessProfile(session)`, and `signOut()`.
- Produces: `window.ShifAWorkspace` with `classifyIntent(text)`, `getToolById(id)`, and `renderToolDirectory(container, tools)`. `classifyIntent` returns a suggestion only; it must not execute a task or call an AI provider.

- [ ] **Step 1: Add failing contract tests**

Assert that the workspace page contains semantic navigation landmarks, a labelled universal command input, Auto/Manual/Project mode controls, mobile navigation toggle, project and activity regions, guide link, and truthful status labels. Assert that command routing has no direct network call and never marks a task as running/completed.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_workspace`

Expected: tests fail because the workspace page and workspace script do not yet exist.

- [ ] **Step 3: Implement the minimum behavior**

Create `workspace.html` with:
- Sticky top bar: brand, search affordance, Help, account state.
- Desktop left navigation for Home, Chat & Research, Coding, Website/App Builder, Image, Video, Voice, Writing/Documents, Business/Marketing, Education/Productivity, Agents/Automation, Projects, Files, Settings.
- Main canvas with welcome panel, universal command box, Auto/Manual/Project selector, suggested actions, recently opened projects, and tool cards.
- Collapsible context/activity panel on desktop; drawer or stacked panels on mobile.
- Clear empty states stating that project persistence and model-backed chat are not connected where applicable.
- Login-required state using existing Supabase session; do not expose Owner-only controls based on client metadata.
- Link every card to a verified existing route or mark it Coming Soon without a fake launch action.

In `scripts/shif-a-workspace.js`, implement deterministic intent suggestions using a small keyword map over the existing tool IDs. Manual mode uses the selected tool. Project mode requires a selected project and otherwise shows a prompt to create/select one. Auto mode displays a recommendation with confidence and requires user confirmation before navigation. Do not send prompts to a model or claim generation. Use textContent for user-supplied text.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_workspace`

Expected: all workspace contract tests pass, including no fake task state and safe text rendering.

- [ ] **Step 5: Run affected integration checks**

Run: `python3 -m unittest discover -s tests -p 'test_shif_a_*.py'`

Run: `node --check scripts/shif-a-workspace.js`

Expected: all SHIF-A contract tests pass and workspace JavaScript syntax is valid.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add workspace.html scripts/shif-a-workspace.js tests/test_shif_a_workspace.py
git commit -m "feat: add SHIF-A command center workspace"
```

### Task 2: Shared Project OS interface and safe local interaction prototype

**Files:**
- Create: `projects.html`
- Create: `scripts/shif-a-projects.js`
- Create: `tests/test_shif_a_projects.py`
- Modify: `workspace.html` to link to Projects and render recent-project empty state.
- Modify: `scripts/shif-a-workspace.js` to expose project navigation only; no client-side authorization decisions.

**Interfaces:**
- Consumes: workspace navigation and existing authenticated session API.
- Produces: `window.ShifAProjects` with `renderProjectState(container, state)` and `formatProjectActivity(event)`. The initial state is server-backed only when an approved endpoint exists; otherwise it is an explicit non-persistent demo/empty state and does not save private project data.

- [ ] **Step 1: Add failing contract tests**

Assert project list, create form, project detail sections (Overview, Chats, Files, Tool Sessions, Activity), task-state labels, confirmation copy for archive/delete, and private-by-default messaging. Assert that no localStorage/sessionStorage project persistence or fake Supabase table writes are introduced.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_projects`

Expected: tests fail because the projects page and script do not exist.

- [ ] **Step 3: Implement the minimum behavior**

Build the responsive project interface with create/open/rename/archive/delete interaction states clearly marked as unavailable until a server endpoint and RLS-backed schema are approved. The UI may validate visible form feedback, but must not claim a project was saved. Define the proposed data contract in documentation: project (id, owner_id, title, description, category, created_at, updated_at, archived_at), project_file metadata, project_session, project_task, and project_activity. Do not apply SQL or create a storage bucket in this task.

Task states are Draft, Queued, Running, Needs Review, Completed, Failed, and Cancelled. Display actual states only when returned by a trusted backend. File metadata includes owner, project, MIME type, size, source tool, and version; uploaded bytes are out of scope until storage policy and limits are approved.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_projects`

Expected: project UI contract tests pass and assert no false persistence claim.

- [ ] **Step 5: Run affected integration checks**

Run: `python3 -m unittest discover -s tests -p 'test_shif_a_*.py'`

Run: `node --check scripts/shif-a-projects.js`

Expected: all SHIF-A tests pass and the project script parses.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add projects.html scripts/shif-a-projects.js tests/test_shif_a_projects.py workspace.html
git commit -m "feat: add SHIF-A shared project workspace UI"
```

### Task 3: Hindi in-product guide and navigation integration

**Files:**
- Create: `user-guide.html`
- Create: `scripts/shif-a-guide.js`
- Create: `tests/test_shif_a_guide.py`
- Modify: `workspace.html` to expose Help links.
- Modify: `projects.html` to expose contextual guide anchors.
- Existing draft: `docs/guides/shif-a-user-guide-hi.md` (keep synchronized with actual tested behavior).

**Interfaces:**
- Consumes: workspace and project navigation IDs and actual tool availability metadata.
- Produces: searchable guide sections with stable anchors for login, workspace, command modes, projects, tools, files, task states, account security, and troubleshooting.

- [ ] **Step 1: Add failing contract tests**

Assert all guide topics have stable anchors, Hindi instructions exist, Available/Limited/Coming Soon definitions match the tool registry, and no unsupported capability is described as working.

- [ ] **Step 2: Verify the relevant failure**

Run: `python3 -m unittest tests.test_shif_a_guide`

Expected: tests fail because the in-product guide page and script do not exist.

- [ ] **Step 3: Implement the minimum behavior**

Create a mobile-first Hindi guide with sidebar/table-of-contents on desktop and collapsible topic navigation on mobile. Add search over guide headings and text. Add contextual links from Workspace and Projects. Update the Markdown guide only for behavior that has been implemented and tested; clearly label future features.

- [ ] **Step 4: Verify the focused pass**

Run: `python3 -m unittest tests.test_shif_a_guide`

Expected: guide contract tests pass and all links resolve to existing anchors.

- [ ] **Step 5: Run affected integration checks**

Run: `python3 -m unittest discover -s tests -p 'test_shif_a_*.py'`

Run: `node --check scripts/shif-a-guide.js`

Expected: all SHIF-A contract tests pass and guide JavaScript syntax is valid.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add user-guide.html scripts/shif-a-guide.js tests/test_shif_a_guide.py workspace.html projects.html docs/guides/shif-a-user-guide-hi.md
git commit -m "feat: add Hindi SHIF-A in-product guide"
```

## Unresolved product decisions

1. **Project persistence activation:** the UI can be built without database writes, but actual saved projects require review of the live Supabase schema, a migration, RLS policies, and explicit deployment approval.
2. **AI provider routing:** no paid provider is assumed. Select a provider only after comparing free-tier quotas, data retention, supported models, and terms; otherwise keep the command box as a truthful tool recommender.
3. **File limits and retention:** determine from actual storage and processing capacity before enabling uploads; do not promise unlimited storage.
4. **Task cancellation/retry semantics:** only enable when a real worker/queue endpoint supports cancellation and idempotency; until then, show no Running/Completed task claims.
5. **Project sharing:** Phase 1 remains private-by-default. Collaboration roles and invitations require a separate authorization design and review.
