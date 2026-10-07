# Results Run Scripts Design

## Goal

Restructure the Results page so selecting a Run displays the runtime scripts belonging to that exact Run. Remove the wide `Launch runtime table` presentation while preserving all runtime-script operations.

## Selected Approach

Use a `Run list + runtime script cards` master-detail layout:

1. Keep the existing Results filter bar and Run selection area.
2. Treat the selected Run as the sole source of scripts.
3. Render its runtime scripts as focused cards below the selected Run summary.
4. Preserve all current runtime editing, Gemini, output, and Google Sheets actions.

This approach is preferred over an accordion because each script has many fields and actions. It is preferred over a three-column Runs/Scripts/Detail layout because it delivers the requested behavior with less state and a smaller presentation-only refactor.

## Page Structure

### Runs

Keep the Run list and its current selection behavior. Clicking a Run calls `setSelectedRunId(run.id)` and changes the content of the main Results area.

The selected Run area displays:

- Profile name.
- Run ID.
- Run status.
- Created time.
- Number of runtime scripts.
- `Add row` action.

Deleting a Run remains available from the Run item.

### Runtime Scripts

Use `selectedRunBundle.run.jobs` as the runtime-script list. Do not include jobs from other Runs, even when those Runs share the same `batchId`.

Each script is rendered as a card rather than as a child row inside a wide table. The card groups information into clear sections:

- Script identity: order/input field, profile, script title, source row/video metadata, and profile URL.
- Runtime state: status, tab ID, current tab URL, submitted time, and relink/open controls.
- Output: collection mode, collect action, editable output, character count, Vietnamese-content warning, view, and copy.
- Error and actions: editable error, Google Sheets write-back state/action, manual text submission for eligible BTV profiles, and delete action.

All controls continue to call the existing handlers from `useResults`.

## Removed Structure

Remove the following presentation and derived state from `ResultsPage`:

- The `Launch runtime table` heading and explanatory copy.
- The horizontally scrolling 10-column runtime table.
- `groupedRuntimeJobCards` and its cross-Run grouping by batch/source row.
- The hidden `results-legacy-detail` block if it remains inaccessible in the final layout.
- CSS that exists only for the removed hidden/table structure, where it has no other consumers.

Removing the hidden legacy block must not remove runtime operations. Any needed action remains exposed through the new script cards.

## State and Data Flow

- `useResults` remains the source of Runs, selection, and runtime actions.
- `selectedRunId` determines `selectedRunBundle`.
- The visible script list derives directly from `selectedRunBundle.run.jobs`.
- Selecting another Run immediately replaces the script cards with that Run's jobs.
- The existing 1.5-second result refresh remains unchanged.
- Local per-job state continues to use the `${runId}:${scriptId}` key for manual submission text and collection mode.

No repository, storage model, runtime messaging contract, or background execution behavior changes are required.

## Empty and Error States

- If no Run is selected, show a focused empty state instead of the runtime table.
- If the selected Run has no runtime scripts, show an empty state with the `Add row` action.
- Existing disabled-action reasons and write-back messages remain visible near their controls.
- Existing copy/operation feedback remains in the page toast/status message.

## Responsive Behavior

- Desktop: Run selection and selected-Run content may retain the existing master-detail grid; each script card uses grouped columns without requiring a page-wide horizontal table.
- Narrow screens: the Run list and main content stack; script card sections collapse into one column.
- Long URLs, output, and errors wrap or scroll within their own bounded fields rather than widening the page.

## Accessibility

- Run selection remains a real button.
- Every editable field has an accessible label, whether visible or supplied through `aria-label`.
- Status is communicated with text as well as color.
- Script-card actions remain keyboard reachable.
- The output modal retains dialog semantics and a clear close action.

## Scope

This change is limited to the Results page presentation and associated Results CSS. It does not redesign execution logic, persistence, filtering behavior, or Google Sheets write-back.

## Acceptance Criteria

- The text and section `Launch runtime table` no longer appear.
- Clicking a Run displays only the runtime scripts stored on that Run.
- Scripts from other Runs in the same batch are not merged into the selected Run.
- Every currently available runtime-script operation remains reachable.
- The page no longer depends on a 10-column, minimum-width runtime table.
- A selected Run with no scripts has a useful empty state and an `Add row` action.
- The layout remains usable without horizontal page overflow at desktop and narrow viewport widths.
- TypeScript/build and configured lint checks pass.

## Verification

- Run the project build/type check.
- Run configured lint checks and inspect editor lints for changed files.
- Open Results with at least two Runs from the same batch and verify each selection shows only its own jobs.
- Exercise status editing, relink/open, manual submit where eligible, collect scripts, output editing/modal/copy, write-back, add row, delete row, and delete Run.
- Verify empty-script and narrow-screen layouts.
