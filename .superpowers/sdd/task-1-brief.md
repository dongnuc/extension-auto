### Task 1: Render Scripts From the Selected Run

**Files:**
- Modify only: `src/dashboard/pages/ResultsPage.tsx`

**Interfaces:**
- Consume the existing `useResults()` runtime fields and action handlers.
- Produce a selected-Run main panel mapping `selectedRunBundle.run.jobs` and these CSS hooks: `.results-selected-run`, `.results-script-list`, `.results-script-card`, `.results-script-card-header`, `.results-script-grid`, `.results-script-section`, `.results-script-actions`, `.results-script-empty`.

## Requirements

1. Remove `useMemo` and unused legacy destructured fields: `selectedJobResult`, `selectedJobResultId`, `selectedStageResults`, `setSelectedJobResultId`.
2. Delete `detailTab`, `groupedRuntimeJobCards`, `runSummary`, `selectedRuntimeJob`, and `selectedRuntimeKey`.
3. Remove the entire hidden `.results-legacy-detail` block and the `Launch runtime table` table.
4. Main panel behavior:
   - No selected Run: empty state asking user to select one.
   - Selected Run: header with profile name, Run ID, status, created time, script count, and Add row.
   - Selected Run with no jobs: empty state and Add row.
   - Otherwise map exactly `selectedRunBundle.run.jobs.map((job, index) => ...)`; do not group/filter across Runs or use `batchId`.
5. Each card must include:
   - Header: `Script {index + 1}`, title, input field, status badge, source row/video metadata, delete.
   - Script identity: labeled profile/title inputs and profile URL.
   - Runtime: labeled status select, numeric tab ID, submitted time, current URL, open/relink, BTV-only manual submit textarea/button.
   - Output: collection mode, `Lấy scripts`, editable output, char count, Vietnamese warning, view modal, copy, write-back plus status/message.
   - Error: editable error textarea.
6. Keep all existing handlers and disabled predicates functionally unchanged: `updateRuntimeJob`, `relinkTabFromUrl`, `submitManualTextToJob`, `collectScripts`, `setOutputModal`, `copyText`, `writeBackRuntimeJob`, `deleteRuntimeJob`, `addRuntimeJob`.
7. Every input/select/textarea needs visible label or `aria-label`.
8. Preserve output modal and toast.
9. Do not change `useResults`, CSS, repositories, models, runtime messaging, or any unrelated file.
10. Existing user work is uncommitted. Do not discard, overwrite, reset, stash, or edit unrelated changes. Commit only `src/dashboard/pages/ResultsPage.tsx`.

## Verification

Run:

```powershell
rg -n "groupedRuntimeJobCards|results-legacy-detail|Launch runtime table|batchId" src/dashboard/pages/ResultsPage.tsx
rg -n "selectedRunBundle\.run\.jobs\.map" src/dashboard/pages/ResultsPage.tsx
npm run build
npm run lint
npx eslint src/dashboard/pages/ResultsPage.tsx
```

Expected: first rg no matches; second rg shows direct map; build passes; repository lint may retain baseline failures outside ResultsPage; focused ESLint must pass.

Commit:

```powershell
git add src/dashboard/pages/ResultsPage.tsx
git commit -m "feat: scope result scripts to selected run"
```
