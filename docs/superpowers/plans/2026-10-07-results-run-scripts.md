# Results Run Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Results page's cross-Run launch runtime table with responsive runtime-script cards scoped to the selected Run.

**Architecture:** Keep `useResults` and all runtime handlers unchanged. Refactor `ResultsPage` so the main panel derives visible cards directly from `selectedRunBundle.run.jobs`, and replace obsolete table/legacy CSS with card layout classes. No test framework exists, so verification uses TypeScript/Vite build, ESLint, focused source assertions, and browser interaction.

**Tech Stack:** React 19, TypeScript 6, CSS, Vite 8, Chrome extension runtime APIs.

## Global Constraints

- Preserve every current runtime-script operation: edit, open/relink, manual submit, collect, output view/copy/edit, Google Sheets write-back, add row, delete row, and delete Run.
- Scripts shown in the main panel must come only from `selectedRunBundle.run.jobs`.
- Do not merge jobs from Runs sharing a `batchId`.
- Remove the `Launch runtime table` section and page-wide 10-column table.
- Keep `useResults`, repositories, storage models, runtime messaging contracts, and background execution behavior unchanged.
- Preserve the existing 1.5-second refresh behavior.
- Avoid new dependencies and UI libraries.
- Keep controls keyboard accessible and provide accessible labels for editable fields.
- Prevent horizontal page overflow at desktop and narrow viewport widths.

---

## File Structure

- Modify `src/dashboard/pages/ResultsPage.tsx`: remove hidden legacy Job Result UI and cross-Run grouping; render selected-Run summary, empty state, and one runtime script card per selected Run job.
- Modify `src/app/styles.css`: remove obsolete Results table/detail selectors and add responsive script-card layout selectors.
- No files are created and no data/business-logic modules are modified.

---

### Task 1: Render Scripts From the Selected Run

**Files:**
- Modify: `src/dashboard/pages/ResultsPage.tsx:1-520`

**Interfaces:**
- Consumes: `useResults()` fields `runs`, `selectedRunBundle`, `selectedRunId`, `copyMessage`, `writingBackJobIds`, selection handlers, and all runtime action handlers.
- Produces: selected-Run main panel whose cards map `selectedRunBundle.run.jobs`; CSS hooks `.results-selected-run`, `.results-script-list`, `.results-script-card`, `.results-script-card-header`, `.results-script-grid`, `.results-script-section`, `.results-script-actions`, and `.results-script-empty`.

- [ ] **Step 1: Remove obsolete Job Result state and cross-Run derivations**

Delete `useMemo` from the React import and remove these Results-only values from the `useResults()` destructuring because the hidden legacy section is being removed:

```tsx
selectedJobResult,
selectedJobResultId,
selectedStageResults,
setSelectedJobResultId,
```

Delete `detailTab`, `groupedRuntimeJobCards`, `runSummary`, `selectedRuntimeJob`, and `selectedRuntimeKey`. Keep `outputModal`, `manualSubmitTextByJob`, and `collectModeByJob` because the runtime cards use them.

- [ ] **Step 2: Replace the hidden legacy section and runtime table shell**

Inside `.results-main-panel`, remove the entire `.results-legacy-detail` block and the `Launch runtime table` table. Add a selected-Run header and script list with this structure:

```tsx
{!selectedRunBundle ? (
  <div className="empty-state results-script-empty">
    <h3>No run selected</h3>
    <p>Select a Run to inspect its runtime scripts.</p>
  </div>
) : (
  <>
    <header className="results-selected-run">
      <div>
        <div className="results-title-row">
          <h2>{selectedRunBundle.run.profileSnapshot.name}</h2>
          <span className={getStatusBadgeClass(selectedRunBundle.run.status)}>
            {selectedRunBundle.run.status}
          </span>
        </div>
        <p>Run ID: {selectedRunBundle.run.id}</p>
      </div>
      <div className="results-selected-run-actions">
        <div className="results-selected-run-meta">
          <span>{selectedRunBundle.run.jobs.length} scripts</span>
          <span>{formatDate(selectedRunBundle.run.createdAt)}</span>
        </div>
        <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>
          Add row
        </button>
      </div>
    </header>

    {selectedRunBundle.run.jobs.length === 0 ? (
      <div className="empty-state results-script-empty">
        <h3>No runtime scripts</h3>
        <p>This Run does not contain any runtime scripts yet.</p>
        <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>
          Add row
        </button>
      </div>
    ) : (
      <div className="results-script-list">
        {selectedRunBundle.run.jobs.map((job, index) => {
          const runId = selectedRunBundle.run.id;
          const jobKey = `${runId}:${job.scriptId}`;
          const collectMode = collectModeByJob[jobKey] ?? 'japanese-scripts';
          const collectEnabled = canCollectScripts(job);
          const writeBackDisabledReason = getWriteBackDisabledReason(job);
          const isWritingBack = writingBackJobIds.includes(jobKey);
          const canSubmitTextToUrl = job.profileName.trim().toUpperCase().startsWith('BTV');

          return (
            <article key={jobKey} className="panel results-script-card">
              {/* Script identity, runtime, output/error, and action sections go here. */}
            </article>
          );
        })}
      </div>
    )}
  </>
)}
```

The temporary JSX comment is allowed only while performing this step; replace it completely in Step 3 before running verification.

- [ ] **Step 3: Populate every runtime script card and preserve all operations**

Inside each `.results-script-card`, add:

1. Header containing `Script {index + 1}`, `job.scriptTitle`, `job.inputField`, status badge, source row/video metadata, and delete button.
2. Script section with labeled inputs for `profileName` and `scriptTitle`, plus profile URL link.
3. Runtime section with labeled status select, numeric `tabId`, submitted time, current URL/open-relink action, and the BTV-only manual submission textarea/button.
4. Output section with collection mode select, `Lấy scripts`, editable output textarea, character count, Vietnamese warning, view/copy actions, and Google Sheets write-back action/message.
5. Error section with editable `errorMessage` textarea.

Use the existing handlers exactly as follows:

```tsx
onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { profileName: event.target.value })}
onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { scriptTitle: event.target.value })}
onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { status: event.target.value as JobStatus })}
onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { tabId: event.target.value ? Number(event.target.value) : null })}
onClick={() => void relinkTabFromUrl(runId, job.scriptId)}
onClick={() => void submitManualTextToJob(runId, job.scriptId, manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT)}
onClick={() => void collectScripts(runId, job.scriptId, collectMode)}
onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { output: event.target.value })}
onClick={() => setOutputModal({ runId, scriptId: job.scriptId, title: `${job.scriptId} · ${job.scriptTitle}`, content: job.output || '' })}
onClick={() => void copyText(job.output, `Copied output for ${job.scriptId}.`)}
onClick={() => void writeBackRuntimeJob(runId, job.scriptId)}
onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { errorMessage: event.target.value || null })}
onClick={() => void deleteRuntimeJob(runId, job.scriptId)}
```

Add visible `<label>` elements or an `aria-label` to every `input`, `select`, and `textarea`. Preserve the current disabled predicates and explanatory messages:

```tsx
disabled={!(job.currentTabUrl || job.url)}
disabled={!collectEnabled}
disabled={Boolean(writeBackDisabledReason) || isWritingBack}
disabled={!job.output}
```

Do not iterate over `runs` or filter by `batchId` anywhere in the selected script list.

- [ ] **Step 4: Run focused source assertions**

Run:

```powershell
rg -n "groupedRuntimeJobCards|results-legacy-detail|Launch runtime table|batchId" src/dashboard/pages/ResultsPage.tsx
rg -n "selectedRunBundle\.run\.jobs\.map" src/dashboard/pages/ResultsPage.tsx
```

Expected: the first command returns no matches; the second returns exactly the selected-Run card mapping.

- [ ] **Step 5: Run build and lint**

Run:

```powershell
npm run build
npm run lint
```

Expected: both commands exit with code 0. If repository-wide lint reports unrelated pre-existing failures, record them and rerun ESLint against `src/dashboard/pages/ResultsPage.tsx` to prove this task adds none.

- [ ] **Step 6: Commit the selected-Run rendering**

```powershell
git add src/dashboard/pages/ResultsPage.tsx
git commit -m "feat: scope result scripts to selected run"
```

Expected: commit includes only `src/dashboard/pages/ResultsPage.tsx`.

---

### Task 2: Add Responsive Runtime Script Card Styling

**Files:**
- Modify: `src/app/styles.css:901-1174`

**Interfaces:**
- Consumes: the class names produced by Task 1.
- Produces: responsive, bounded script cards without the deleted wide runtime table or horizontal page overflow.

- [ ] **Step 1: Remove obsolete Results selectors**

Delete selectors used only by the removed hidden/detail/table UI:

```css
.results-legacy-detail
.results-runtime-panel
.results-run-meta-grid
.results-summary-grid
.results-summary-card
.results-jobs-table-wrap
.results-jobs-table tr.selected-row td
.results-table-actions
.results-detail-card
.results-tabs
.results-output-box
.results-stage-list
.results-stage-card
```

Keep shared selectors such as `.action-row`, `.results-title-row`, and Run list/card styles. Before deleting a selector, use `rg` to confirm it has no remaining consumer outside the removed `ResultsPage` JSX.

- [ ] **Step 2: Add selected-Run and script-card styles**

Add these concrete styles near the existing Results styles:

```css
.results-selected-run,
.results-script-card-header,
.results-selected-run-actions,
.results-selected-run-meta,
.results-script-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
}

.results-selected-run,
.results-script-card-header {
  justify-content: space-between;
}

.results-selected-run {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}

.results-selected-run p,
.results-script-card-header p,
.results-script-help {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.results-selected-run-actions {
  justify-content: flex-end;
}

.results-selected-run-meta {
  color: var(--text-secondary);
  font-size: 12px;
}

.results-script-list {
  display: grid;
  gap: var(--space-4);
}

.results-script-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  min-width: 0;
}

.results-script-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.results-script-section {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-surface-2);
}

.results-script-section-wide {
  grid-column: 1 / -1;
}

.results-script-section h4 {
  margin: 0;
  color: var(--text-primary);
}

.results-script-section a {
  color: var(--text-link);
  overflow-wrap: anywhere;
}

.results-script-section textarea {
  min-height: 92px;
}

.results-script-actions {
  align-items: flex-start;
}

.results-script-empty {
  min-height: 220px;
}
```

- [ ] **Step 3: Add narrow-screen behavior**

Inside the existing `@media (max-width: 760px)` block, add:

```css
.results-script-grid {
  grid-template-columns: 1fr;
}

.results-script-section-wide {
  grid-column: auto;
}

.results-selected-run-actions {
  width: 100%;
  justify-content: flex-start;
}
```

Ensure fields use the existing bounded `cellInputStyle`/`cellTextareaStyle` and links use `overflow-wrap`, so long URLs and outputs cannot widen the page.

- [ ] **Step 4: Run source, build, and lint verification**

Run:

```powershell
rg -n "results-legacy-detail|results-runtime-panel|results-jobs-table|results-detail-card" src/app/styles.css src/dashboard/pages/ResultsPage.tsx
npm run build
npm run lint
```

Expected: `rg` returns no matches and both npm commands exit with code 0. If repository-wide lint has unrelated existing failures, run:

```powershell
npx eslint src/dashboard/pages/ResultsPage.tsx
```

Expected: the focused ESLint command exits with code 0.

- [ ] **Step 5: Perform browser verification**

Start the dashboard with `npm run dev`, open the dashboard Results route, and verify:

1. With two Runs from the same batch, selecting each Run shows only jobs from that Run.
2. `Launch runtime table` is absent.
3. Add row and delete row update the selected Run.
4. Status, profile, title, tab ID, output, and error fields remain editable.
5. Open/relink, eligible BTV manual submit, collect scripts, output modal/copy, and write-back controls are present with their prior disabled states.
6. A Run with no jobs shows the empty state and `Add row`.
7. At desktop width and below 760px, no horizontal page overflow appears.
8. Keyboard tab navigation reaches Run selection and every script action.

Expected: all eight checks pass. Capture any workflow that cannot be exercised because test data, Chrome runtime tabs, or Google Sheets credentials are unavailable, while still confirming its control and disabled explanation render correctly.

- [ ] **Step 6: Commit the responsive styling**

```powershell
git add src/app/styles.css
git commit -m "style: add selected run script cards"
```

Expected: commit includes only `src/app/styles.css`.

---

### Task 3: Final Regression Verification

**Files:**
- Verify: `src/dashboard/pages/ResultsPage.tsx`
- Verify: `src/app/styles.css`

**Interfaces:**
- Consumes: completed selected-Run card rendering and styling.
- Produces: evidence that the approved Results behavior is buildable, lint-clean for changed code, and manually usable.

- [ ] **Step 1: Inspect the final diff for scope**

Run:

```powershell
git diff HEAD~2 -- src/dashboard/pages/ResultsPage.tsx src/app/styles.css
git status --short
```

Expected: the two commits only change the intended Results JSX and CSS. Existing unrelated working-tree changes remain untouched.

- [ ] **Step 2: Run final automated checks**

Run:

```powershell
npm run build
npm run lint
```

Expected: both exit with code 0, or any repository-wide pre-existing lint failures are explicitly reported alongside a passing focused ESLint check for `ResultsPage.tsx`.

- [ ] **Step 3: Confirm acceptance criteria through source checks**

Run:

```powershell
rg -n "Launch runtime table|groupedRuntimeJobCards|batchId|<table" src/dashboard/pages/ResultsPage.tsx
rg -n "selectedRunBundle\.run\.jobs\.map|addRuntimeJob|deleteRuntimeJob|collectScripts|writeBackRuntimeJob|submitManualTextToJob|relinkTabFromUrl" src/dashboard/pages/ResultsPage.tsx
```

Expected: the first command returns no matches. The second confirms direct selected-Run mapping and every required runtime operation.

- [ ] **Step 4: Record verification results**

In the implementation handoff, report:

- Build result.
- Lint result, including whether failures were pre-existing.
- Browser checks completed.
- Browser checks blocked by unavailable external state.
- Exact changed files and commit hashes.

No documentation file or extra commit is required for this report.
