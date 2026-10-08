# Results Runs and Script Table Design

## Goal

Restructure the Results page into a focused two-pane workspace: a run list on the left and a table of runtime scripts for the selected run on the right. Preserve the existing collection, manual submission, output editing, and Google Sheets write-back behavior while removing unrelated filters and detail cards.

## Scope

### Included

- Keep the selectable run list in a left column.
- Replace per-script detail cards with one table in the right column.
- Show one runtime script per table row.
- Display only the source row identifier for script identity; do not display `scriptTitle`.
- Keep an editable manual-submit message and Submit button per row.
- Keep editable collected output per row.
- Keep collection mode selection, collection action, and Google Sheets write-back action per row.
- Add independent scrolling and responsive stacking.

### Excluded

- Changes to run execution, tab messaging, collection extraction, or sheet write-back internals.
- Search, profile/status/date filters, sorting controls, summary metrics, Add row, delete job, status editing, tab ID editing, relinking, output modal, copying output, and error editing.
- Changes to result/run storage models.

## Layout

### Desktop

Use a two-column grid with an approximate 22% / 78% distribution.

- Left: Runs panel.
- Right: selected run's runtime-script table.
- Both panels use the existing dark dashboard visual language.
- Each panel may scroll independently within the viewport.

### Narrow Screens

- Stack Runs above the script table.
- Keep the script table horizontally scrollable.
- Preserve practical minimum widths for textarea and action columns.

## Runs Panel

The left panel displays every available run. Each item contains:

- Profile/run name.
- Run ID.
- Run status.
- Number of runtime scripts.
- Creation time.
- Delete-run icon.

Selecting an item calls the existing `setSelectedRunId` behavior and updates the table. The selected run receives a clear active state. Deleting a run continues to call the existing `deleteRun` behavior.

The existing top filter bar and run sorting select are removed.

## Runtime Script Table

The right panel contains a compact heading identifying the selected run and a semantic HTML table. If no run is selected, show a compact empty state. If the selected run has no runtime scripts, show an empty table state.

### Columns

#### 1. STT

Display the one-based row index.

#### 2. Source Row

Display:

1. `job.source?.sourceRowNumber` when present.
2. Otherwise `job.scriptNumberNo`.
3. Otherwise an em dash.

Do not display or edit `job.scriptTitle` in the table.

#### 3. Manual Submit Text

- Render an editable textarea for each job.
- Initialize it from the current default message:
  `từ tiêu đề này hãy viết mô tả (220 ký tự trong đó phải đảm bảo phải viết được keywords chính) tag + hag tag`
- Store edits in the existing page-local map keyed by `runId:scriptId`.
- Render a Submit button immediately below the textarea.
- Submit through `submitManualTextToJob(runId, scriptId, text)`.
- Disable submission when the current/default URL is unavailable or the message is empty.
- Preserve the current BTV profile guard: jobs whose profile name does not start with `BTV` do not submit. Show concise unavailable guidance instead of a working button.

#### 4. Output

- Render an editable textarea bound to `job.output`.
- Update through `updateRuntimeJob(runId, scriptId, { output })`.
- Content collected from the Gemini tab appears here through the existing hook state update.
- Show character count.
- When mode is scripts-only and Vietnamese text is detected, preserve the current warning.

#### 5. Actions

Render vertically grouped controls:

- Collection mode select:
  - `Scripts only` maps to `japanese-scripts`.
  - `Full response` maps to `full-response`.
- `Lấy scripts` button calling `collectScripts(runId, scriptId, mode)`.
- `Write back to Sheet` button calling `writeBackRuntimeJob(runId, scriptId)`.
- Preserve current collection availability from `canCollectScripts(job)`.
- Preserve current write-back disabled reason, loading label, target row/column status, and result/error message.

## Removed UI

Remove these elements from Results:

- Search/profile/status/date filter toolbar.
- Run sorting dropdown.
- Selected-run summary/header actions.
- Add row controls.
- Per-job detail cards.
- Profile name and script title inputs.
- Status and Tab ID inputs.
- Open/relink action.
- Delete job action.
- View-output modal.
- Copy-output action and global copy toast.
- Error editor.

Unused page-level state and hook destructuring must be removed. Hook functions may remain exported for other consumers; no behavior needs to be deleted from `useResults`.

## Component Boundaries

For maintainability, split the page into focused Results components when practical:

- `ResultsRunList`: run selection and run deletion.
- `ResultsScriptTable`: table rendering and row actions.
- `ResultsPage`: obtains hook state, owns per-job manual-message and collection-mode maps, and composes the two panes.

The implementation may keep the run list in `ResultsPage` if extraction adds no clarity, but the table should remain understandable and avoid duplicating hook logic.

## Data Flow

1. `useResults` loads runs and resolves `selectedRunBundle`.
2. Clicking a run updates `selectedRunId`.
3. The selected bundle's `run.jobs` becomes the table data.
4. Manual-message and collection-mode UI state are keyed by `runId:scriptId`.
5. Manual submission, collection, output edits, and write-back invoke existing hook callbacks.
6. Hook/repository updates rerender the relevant output and write-back status cells.

## Error and Disabled States

- Loading uses the existing Results loading card.
- No runs uses the existing Results empty state.
- No selected run shows selection guidance in the right pane.
- No jobs shows a table-specific empty state.
- Buttons retain disabled states and explanatory helper text.
- Write-back errors and success messages remain visible within the relevant action cell.

## Accessibility

- Use a semantic table with column headers.
- Every textarea receives an accessible label including its source row or row index.
- Run items and action controls remain keyboard-operable buttons/selects.
- Delete-run buttons retain explicit accessible labels.
- Disabled behavior is represented by native `disabled` attributes where applicable.

## Verification

- Selecting each run updates the table rows.
- Source Row follows the documented fallback and no script title appears.
- Editing and submitting manual text invokes the existing action with the selected job.
- Switching collection mode changes the mode passed to collection.
- Collecting output updates the Output cell.
- Editing output persists through the existing update callback.
- Write-back retains loading, disabled, success, and failure feedback.
- Removed filters, detail cards, modal, and unused actions no longer render.
- Desktop shows two panes; narrow layouts stack and the table scrolls horizontally.
- TypeScript/Vite build succeeds and touched Results files pass ESLint.
