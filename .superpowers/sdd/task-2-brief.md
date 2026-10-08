### Task 2: Add Responsive Runtime Script Card Styling

Modify only `src/app/styles.css` for the class hooks already added in Task 1. Preserve all unrelated uncommitted work in this file and commit only this file.

## Requirements

1. Before deleting selectors, search consumers. Remove obsolete selectors used only by deleted Results UI: `.results-legacy-detail`, `.results-runtime-panel`, `.results-run-meta-grid`, `.results-summary-grid`, `.results-summary-card`, `.results-jobs-table-wrap`, `.results-jobs-table tr.selected-row td`, `.results-table-actions`, `.results-detail-card`, `.results-tabs`, `.results-output-box`, `.results-stage-list`, `.results-stage-card`. Keep shared `.action-row`, `.results-title-row`, and Run list/card styles.
2. Add responsive styles for `.results-selected-run`, `.results-script-card-header`, `.results-selected-run-actions`, `.results-selected-run-meta`, `.results-script-actions`, `.results-script-list`, `.results-script-card`, `.results-script-grid`, `.results-script-section`, `.results-script-section-wide`, `.results-script-help`, and `.results-script-empty`.
3. Desktop card grid: two equal bounded columns via `repeat(2, minmax(0, 1fr))`; wide section spans both columns.
4. Each section: `min-width: 0`, grid layout, spacing/padding, border, radius, nested surface background. Links must use `overflow-wrap: anywhere`; textareas minimum 92px.
5. At `max-width: 760px`, script grid becomes one column, wide section resets to `grid-column: auto`, selected-run actions become full-width and left-aligned.
6. Prevent long links/fields from causing horizontal page overflow.
7. Minor follow-up from review: add `aria-label="Delete run"` to the delete-Run icon in `src/dashboard/pages/ResultsPage.tsx`. This is the only permitted TSX edit; amend it into the existing Task 1 commit if safely possible, or make a tiny separate commit. Do not remove or implement the existing filter bar—the user explicitly chose to keep it per the approved spec.
8. Do not alter business logic or any other file.

## Verification

Run focused source search, `npm run build`, `npm run lint`, and `npx eslint src/dashboard/pages/ResultsPage.tsx`. Repository-wide lint has baseline failures outside ResultsPage; focused lint must pass.

Perform browser verification if local dashboard data/runtime permits: selected Run isolation; no Launch runtime table; add/delete/edit controls; operations present/disabled as before; empty state; desktop and <760px overflow; keyboard reachability. Explicitly report anything blocked by unavailable test data or extension runtime state.

Commit CSS as `style: add selected run script cards`. Keep commit contents scoped. Write full report to `E:\coding\Tools\Extensions-auto-gem\.superpowers\sdd\task-2-report.md`.
