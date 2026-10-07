# Dashboard UI Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Gemini Auto Flow dashboard UI around the approved Automation Control Center structure while preserving existing dashboard workflows.

**Architecture:** Introduce a shared dashboard shell and CSS design tokens first, then migrate pages to the documented layout patterns without rewriting storage/hooks/business logic. Page changes should be presentation-oriented and should reuse the current hooks/components unless a small helper component makes the UI clearer.

**Tech Stack:** React, TypeScript, existing Vite/extension dashboard structure, CSS in `src/app/styles.css`, existing local hooks/repositories.

## Global Constraints

- Do not remove existing user workflows.
- Do not introduce a new UI library unless already present or clearly necessary.
- Avoid large business-logic rewrites.
- Keep existing hooks as the source of data.
- Preserve Vietnamese/English labels currently used where they reflect app behavior, but normalize UI structure.
- Use the documented dark SaaS palette from `docs/design/Gemini_Auto_Flow_UI_Design_System.md`.
- Primary buttons are only for primary actions such as save, create, import, and start run.
- Results must use a clear `Runs | Jobs | Result Detail` master-detail layout.
- Run must use a `Run Configuration | Launch Preview` structure.
- Google Sheets must be visually grouped as a 4-step import/config flow.

---

## File Structure

- Modify `src/app/styles.css`: add design tokens, shell classes, sidebar classes, compact tables, status badges, page header, metric cards, empty states, and responsive layout utilities.
- Modify `src/dashboard/DashboardApp.tsx`: replace top header nav with sidebar shell, add Dashboard route/default, define page metadata, render page header.
- Create `src/dashboard/pages/DashboardPage.tsx`: summary landing page using lightweight data from existing repositories/hooks where practical.
- Modify `src/dashboard/pages/ProfilesPage.tsx`: wrap existing list/editor in new page grid classes and remove old ad hoc spacing where possible.
- Modify `src/dashboard/pages/ScriptsPage.tsx`: restyle batch manager, import area, script list/editor using the new foundation; visually separate Google Sheets import steps.
- Modify `src/dashboard/pages/GoogleSheetsPage.tsx`: restyle config management as a 4-step setup/config screen.
- Modify `src/dashboard/pages/RunPage.tsx`: apply new two-column run layout and page-section classes.
- Modify `src/dashboard/pages/ResultsPage.tsx`: refactor visual structure to master-detail while preserving hook actions.
- Modify `src/dashboard/pages/RunCalendarPage.tsx`: restyle history/calendar table, dialog, and status badges.
- Modify component files only as needed for class names and compact action styling: `src/dashboard/components/profile/*`, `src/dashboard/components/scripts/*`, `src/dashboard/components/run/*`.

---

### Task 1: Design Foundation and Shell

**Files:**
- Modify: `src/app/styles.css`
- Modify: `src/dashboard/DashboardApp.tsx`
- Create: `src/dashboard/pages/DashboardPage.tsx`

**Interfaces:**
- Consumes: current hash navigation convention `#/<sectionId>`.
- Produces: `DashboardPage` React component; CSS classes `.app-shell`, `.sidebar`, `.sidebar-item`, `.main-shell`, `.page-header`, `.metric-grid`, `.data-table`, `.status-badge`, `.empty-state`.

- [ ] **Step 1: Add design tokens and base UI classes**

Update `src/app/styles.css` so the top of the file defines the approved variables:

```css
:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--text-primary);
  background: var(--bg-app);
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  --bg-app: #07111f;
  --bg-sidebar: #091525;
  --bg-surface: #0c1829;
  --bg-surface-2: #101e32;
  --bg-hover: #142640;
  --bg-selected: #163567;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --violet: #a78bfa;
  --text-primary: #e6edf7;
  --text-secondary: #a8b6cc;
  --text-muted: #718096;
  --text-disabled: #4b5b70;
  --text-link: #60a5fa;
  --border-default: #223249;
  --border-input: #293a53;
  --border-hover: #365274;
  --border-focus: #3b82f6;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
}
```

Then replace old glow-heavy body/panel/button styles with token-driven classes. Preserve existing class names `.panel`, `.card`, `.button`, `.field`, `.badge`, `.section-title`, `.section-subtitle` so current components still render.

- [ ] **Step 2: Add shell/layout utility classes**

Add these concrete classes to `src/app/styles.css`:

```css
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  background: var(--bg-app);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: var(--space-4);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-default);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-6);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.sidebar-nav {
  display: grid;
  gap: var(--space-2);
  align-content: start;
}

.sidebar-group-label {
  margin: var(--space-4) var(--space-2) var(--space-1);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar-item {
  position: relative;
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  padding: 10px 12px 10px 14px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  text-align: left;
}

.sidebar-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--bg-selected);
  color: #f1f5f9;
  border-color: rgba(96, 165, 250, 0.18);
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 999px;
  background: var(--primary-500);
}

.sidebar-icon {
  width: 20px;
  display: inline-grid;
  place-items: center;
  color: var(--primary-400);
}

.main-shell {
  min-width: 0;
  padding: var(--space-6);
  display: grid;
  gap: var(--space-6);
  align-content: start;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.page-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--primary-400);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.2;
}

.page-description {
  margin: var(--space-2) 0 0;
  max-width: 780px;
  color: var(--text-secondary);
  font-size: 14px;
}
```

- [ ] **Step 3: Add compact component classes**

Add `.metric-grid`, `.metric-card`, `.split-grid`, `.master-detail-grid`, `.data-table`, `.status-badge`, `.icon-button`, `.empty-state`, `.step-list`, `.step-item` to `src/app/styles.css`. Use 12px card radius, compact table rows, and status variants for `completed`, `failed`, `skipped`, `pending`, `running`, `enabled`, `disabled`.

- [ ] **Step 4: Create `DashboardPage`**

Create `src/dashboard/pages/DashboardPage.tsx` with a simple summary view that does not require new business logic. Use static quick action buttons that navigate by setting `window.location.hash`.

```tsx
export function DashboardPage() {
  const quickActions = [
    { label: 'Add Gemini Profile', hash: '#/profiles' },
    { label: 'Create Script Batch', hash: '#/scripts' },
    { label: 'Import Google Sheet', hash: '#/google-sheets' },
    { label: 'Start Run', hash: '#/run' },
  ];

  return (
    <div className="dashboard-grid">
      <section className="metric-grid">
        <div className="metric-card"><span>Profiles</span><strong>Manage</strong><small>Gemini profile setup</small></div>
        <div className="metric-card"><span>Scripts</span><strong>Prepare</strong><small>Batches and stages</small></div>
        <div className="metric-card"><span>Run</span><strong>Automate</strong><small>Launch Gemini flows</small></div>
        <div className="metric-card"><span>Results</span><strong>Review</strong><small>Outputs and write-back</small></div>
      </section>

      <section className="panel card section-stack">
        <div>
          <h2 className="section-title">Automation Control Center</h2>
          <p className="section-subtitle">Use the sidebar to configure profiles, prepare data, run automation, and inspect results.</p>
        </div>
      </section>

      <section className="panel card section-stack">
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Jump to the most common workflow steps.</p>
        </div>
        <div className="quick-action-grid">
          {quickActions.map((action) => (
            <button key={action.hash} type="button" className="button secondary" onClick={() => { window.location.hash = action.hash; }}>
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Replace top navigation with sidebar shell**

Modify `src/dashboard/DashboardApp.tsx`:

- Import `DashboardPage`.
- Add section id `dashboard` and make it default.
- Replace the old header/nav JSX with `.app-shell`, `.sidebar`, `.main-shell`, and `.page-header`.
- Define metadata for each section title/description.

- [ ] **Step 6: Run verification**

Run:

```powershell
npm run build
```

Expected: build completes. If the project has no build script, run `npm run` and use the closest TypeScript/check script listed.

- [ ] **Step 7: Commit**

```powershell
git add src/app/styles.css src/dashboard/DashboardApp.tsx src/dashboard/pages/DashboardPage.tsx
git commit -m "feat: add dashboard shell and design foundation"
```

---

### Task 2: Restyle Profiles, Scripts, Google Sheets, and Run Pages

**Files:**
- Modify: `src/dashboard/pages/ProfilesPage.tsx`
- Modify: `src/dashboard/pages/ScriptsPage.tsx`
- Modify: `src/dashboard/pages/GoogleSheetsPage.tsx`
- Modify: `src/dashboard/pages/RunPage.tsx`
- Modify as needed: `src/dashboard/components/profile/ProfileList.tsx`, `src/dashboard/components/profile/ProfileEditor.tsx`, `src/dashboard/components/profile/StageListEditor.tsx`, `src/dashboard/components/scripts/ScriptList.tsx`, `src/dashboard/components/scripts/ScriptEditor.tsx`, `src/dashboard/components/run/RunConfigPanel.tsx`, `src/dashboard/components/run/RunPreviewPanel.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1.
- Produces: pages aligned to list/detail, wizard, and two-column run patterns without changing hook APIs.

- [ ] **Step 1: Update page wrappers**

Replace ad hoc inline outer grids with named classes:

- `ProfilesPage`: `.split-grid split-grid--profiles`.
- `ScriptsPage`: `.section-stack`, `.split-grid`, `.wizard-panel`.
- `GoogleSheetsPage`: `.split-grid split-grid--sheets` plus `.step-list`.
- `RunPage`: `.split-grid split-grid--run`.

- [ ] **Step 2: Restyle Profiles list/detail**

Keep `useProfiles()` and component props unchanged. Ensure `ProfileList` looks like a compact list/table and `ProfileEditor` remains the detail panel. Use `.button` only for create/save and `.button secondary` or `.icon-button` for duplicate/delete.

- [ ] **Step 3: Restyle Scripts page import area as steps**

In `ScriptsPage`, keep all current import functions. Reorganize the import section visually:

```tsx
<section className="panel card section-stack">
  <div>
    <h2 className="section-title">Import from Google Sheet</h2>
    <p className="section-subtitle">Connect, map columns, validate row range, then import or enrich sheet data.</p>
  </div>
  <div className="step-list">
    <div className="step-item is-active"><span>1</span><strong>Connect</strong><small>Select saved Sheet config</small></div>
    <div className="step-item"><span>2</span><strong>Map Columns</strong><small>Title, content, output, transcript</small></div>
    <div className="step-item"><span>3</span><strong>Range</strong><small>Start and end rows</small></div>
    <div className="step-item"><span>4</span><strong>Import</strong><small>Run import/write-back helpers</small></div>
  </div>
  {/* existing fields and buttons, grouped under matching subsections */}
</section>
```

- [ ] **Step 4: Restyle Google Sheets config page as setup flow**

Keep `configs`, `selectedId`, `draft`, `saveConfig`, and `deleteConfig`. Add a visual step list at the top of the detail panel:

1. Connect Sheet.
2. Apps Script.
3. Token.
4. Save Config.

Use existing inputs and validations.

- [ ] **Step 5: Confirm Run page two-column structure**

Keep `RunConfigPanel` and `RunPreviewPanel`, but wrap with the new run split class. If necessary, update panel titles inside components to match `Run Configuration` and `Launch Preview`.

- [ ] **Step 6: Run verification**

Run:

```powershell
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 7: Commit**

```powershell
git add src/dashboard/pages/ProfilesPage.tsx src/dashboard/pages/ScriptsPage.tsx src/dashboard/pages/GoogleSheetsPage.tsx src/dashboard/pages/RunPage.tsx src/dashboard/components/profile src/dashboard/components/scripts src/dashboard/components/run
git commit -m "feat: restyle setup and run pages"
```

---

### Task 3: Refactor Results and Run Calendar Visual Structure

**Files:**
- Modify: `src/dashboard/pages/ResultsPage.tsx`
- Modify: `src/dashboard/pages/RunCalendarPage.tsx`

**Interfaces:**
- Consumes: `useResults()` and `useRunCalendar()` unchanged.
- Produces: Results master-detail layout with the same result actions; calendar/history styling aligned to design foundation.

- [ ] **Step 1: Convert Results outer layout to master-detail**

In `ResultsPage`, replace the current three-column broad grid with:

```tsx
<div className="master-detail-grid master-detail-grid--results">
  <section className="panel card section-stack">{/* Runs */}</section>
  <section className="panel card section-stack">{/* Jobs */}</section>
  <section className="panel card section-stack">{/* Result Detail */}</section>
</div>
```

- [ ] **Step 2: Keep run selection behavior**

The Runs column should still call `setSelectedRunId(run.id)` and `deleteRun(run.id)`. Use compact list items with status badges and counts.

- [ ] **Step 3: Keep job selection behavior**

The Jobs column should still call `setSelectedJobResultId(...)` and show final output status for each script. Use compact rows, not large row cards.

- [ ] **Step 4: Preserve detail actions**

The Result Detail panel must keep existing actions from `ResultsPage`, including copy, collect scripts, relink tab, manual submit, write back, output modal, runtime job editing, and deletion where currently present. Move them into grouped action rows if needed, but do not remove them.

- [ ] **Step 5: Apply status badges**

Map statuses to classes like:

```tsx
<span className={`status-badge status-badge--${status}`}>{status}</span>
```

If a status contains values not covered by CSS, it should still render using default `.status-badge`.

- [ ] **Step 6: Restyle Run Calendar**

Convert row-card table styling to `.data-table` or compact panel rows. Use `.status-badge` for entry statuses and `.button secondary` for view/recover/delete actions, reserving primary buttons for recover if considered the main row action.

- [ ] **Step 7: Run verification**

Run:

```powershell
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 8: Commit**

```powershell
git add src/dashboard/pages/ResultsPage.tsx src/dashboard/pages/RunCalendarPage.tsx
git commit -m "feat: restructure results and calendar views"
```

---

### Task 4: Final Visual Pass and Regression Check

**Files:**
- Modify: any dashboard files touched in Tasks 1-3 if needed.
- Read-only reference: `docs/design/Gemini_Auto_Flow_UI_Design_System.md`

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: final polished UI consistent across pages.

- [ ] **Step 1: Search for old hard-coded colors that should use tokens**

Run a code search for common old colors and inline panel styles. Replace obvious repeated colors such as `#9fb1cd`, `#bfd0ea`, `#60a5fa`, `rgba(148, 163, 184` with token classes or CSS variables where safe.

- [ ] **Step 2: Check navigation hashes**

Manually verify these routes still render:

- `#/dashboard`
- `#/profiles`
- `#/scripts`
- `#/google-sheets`
- `#/run`
- `#/results`
- `#/run-calendar`

- [ ] **Step 3: Run build/type verification**

Run:

```powershell
npm run build
```

Expected: build completes.

- [ ] **Step 4: Run lint if available**

Run:

```powershell
npm run
```

If a lint script is listed, run it. Expected: lint completes or existing unrelated issues are documented.

- [ ] **Step 5: Review git diff**

Run:

```powershell
git diff --stat
git diff -- src/app/styles.css src/dashboard/DashboardApp.tsx src/dashboard/pages/ResultsPage.tsx
```

Expected: changes are UI structure/style focused and do not remove existing data actions.

- [ ] **Step 6: Commit final polish**

```powershell
git add src/app/styles.css src/dashboard
git commit -m "style: polish dashboard automation control center UI"
```

---

## Self-Review

- Spec coverage: Task 1 covers shell, tokens, dashboard, shared UI patterns. Task 2 covers Profiles, Scripts, Google Sheets, and Run. Task 3 covers Results and Run Calendar. Task 4 covers final visual consistency and verification.
- Placeholder scan: no TBD/TODO placeholders are present; each task has specific files, expected structure, commands, and commit messages.
- Type consistency: new exported component is `DashboardPage`; CSS class names are defined in Task 1 and consumed in later tasks.
