# Scripts Page Three-Column Layout Design

## Goal

Restructure the Scripts page to match the supplied reference layout while preserving the existing script selection, autosave, batch selection, Google Sheets import, translation, and YouTube extraction behavior.

The page will emphasize three primary working areas:

1. Script list on the left.
2. Selected script editor in the center.
3. Google Sheets import configuration on the right.

A horizontal batch list will appear above these three areas.

## Scope

### Included

- Replace the current batch manager card with a horizontal batch tab/chip list.
- Arrange the script list, script editor, and Google Sheets import panel in a desktop three-column layout.
- Bind the center editor to the script selected in the left list.
- Move per-script deletion into the left list as a trash icon.
- Remove script creation, duplication, and reordering controls from this page.
- Remove batch name editing and reset controls from the script editor.
- Preserve existing autosave and validation behavior for editable script fields.
- Preserve the complete Google Sheets configuration and execution behavior.
- Add responsive stacking for narrower screens.

### Excluded

- Changes to the storage model or repository APIs.
- Changes to Google Sheets import, translation, or YouTube extraction logic.
- New search, filtering, sorting, pagination, or batch create/delete controls.
- A replacement workflow for adding, duplicating, or reordering scripts.
- Visual or behavioral changes to other dashboard pages.

## Page Structure

### Header

Keep the existing dashboard page title and description supplied by the dashboard shell. The Scripts page itself will not add a second large page header.

### Batch Navigation

Display all available batches as horizontally arranged tabs or chips above the workspace.

- The selected batch is visually emphasized.
- Selecting a batch calls the existing batch-selection handler.
- The row scrolls horizontally when all batches do not fit.
- The current dropdown selector, batch-name field, New Batch button, and Delete Batch button are removed from this page.
- No script search field, status selector, Add Script button, or Import from Sheets shortcut is added to this row.

### Three-Column Workspace

On desktop, use an approximate width distribution of 24% / 48% / 28% for the script list, editor, and import configuration respectively. CSS may adjust these values with minimum widths to prevent unusable controls.

#### Left Column: Script List

The list contains scripts from the selected batch.

Each row shows:

- NumberNo, with a sensible fallback when absent.
- Script title, with a generated fallback when absent.
- Character count.
- Enabled or disabled status.
- A trash icon for deleting that script.

Interaction rules:

- Clicking the row selects the script and binds it to the center editor.
- Clicking the trash icon stops row selection propagation, selects the target script if necessary, and invokes the existing delete behavior for that script.
- The selected row has a clear active state.
- The list has an independent vertical scroll area when it exceeds the available workspace height.
- Add, Duplicate, Move Up, Move Down, Enable, and Disable buttons are removed from the list. Availability remains editable in the center editor.
- If the batch is empty, show a compact empty state without an Add Script action.

#### Center Column: Selected Script Editor

The editor displays and updates the script selected in the left column.

Keep these fields:

- NumberNo.
- Video title.
- Availability.
- Character count.
- Content.

Behavior:

- Updates use the existing selected-script update callback.
- Existing debounced autosave behavior remains unchanged.
- Save state remains visible in the editor header.
- Existing validation errors remain visible.
- When no script is selected, display the existing empty editor guidance.
- Remove batch name editing, reset batch, duplicate, delete, and movement controls from the editor.

#### Right Column: Import from Google Sheets

Move the current import wizard into the right column and preserve its existing data and callbacks.

The panel keeps:

- Saved Google Sheet config selection.
- Current sheet name information.
- All column mappings.
- Start and end row range.
- Save Config.
- Import Sheet.
- Translate titles.
- Extract YouTube transcript.
- Loading, disabled, success, and error/status messaging behavior already exposed by the current hook.

Presentation changes:

- Use a denser, vertically grouped panel inspired by the reference image.
- Keep clear group headings for configuration selection, column mapping, row range, and actions.
- The panel may scroll vertically independently when its content exceeds the workspace height.
- Do not duplicate an Import from Sheets shortcut in the batch row or elsewhere on the page.

## Component Responsibilities

### `ScriptsPage`

- Read state and actions from `useScriptBatch`.
- Render batch tabs.
- Compose the three-column workspace.
- Pass only required callbacks into child components.
- Continue rendering the loading state when batch data is unavailable.

### `ScriptList`

- Render selectable scripts for the current batch.
- Render and handle the per-row delete icon.
- No longer expose add, duplicate, toggle, or move controls.

### `ScriptEditor`

- Render only selected-script editing concerns.
- No longer edit batch metadata or expose batch reset actions.

### Google Sheets Import Panel

The import markup may remain in `ScriptsPage` for a minimal change, but extracting it into a focused component is preferred if it keeps `ScriptsPage` understandable without changing behavior. Any extraction must use the existing state and callbacks rather than duplicate import logic.

## Data Flow

1. `useScriptBatch` loads batches and tracks `selectedBatchId` and `selectedScriptId`.
2. Clicking a batch tab updates `selectedBatchId`.
3. The hook resolves the current batch and its selected script.
4. Clicking a script row updates `selectedScriptId`.
5. `ScriptEditor` receives `selectedScript` and updates it through `updateSelectedScript`.
6. Autosave continues through the hook's existing persistence flow.
7. Clicking a script trash icon targets that script and invokes the existing deletion flow.
8. The import panel continues using `sheetImportForm`, saved sheet configs, and the existing import/helper callbacks.

## Error and Empty States

- Preserve the current loading card while batches are loading.
- If no script is selected, show guidance in the center editor.
- If the selected batch has no scripts, show a compact empty state in the left column.
- Preserve script validation errors in the center editor.
- Preserve import messages and button disabled/loading states in the import panel.
- Deleting the selected script relies on the hook's existing selection normalization after deletion.

## Responsive Behavior

- Wide screens: batch navigation above a three-column workspace.
- Medium screens: allow columns to use practical minimum widths; the layout may reduce to two columns if needed.
- Narrow screens: stack batch navigation, script list, editor, and import panel vertically in that order.
- Batch navigation remains horizontally scrollable.
- Avoid horizontal overflow from mapping fields and action buttons.

## Accessibility

- Batch tabs and script rows remain keyboard-operable buttons.
- The active batch and selected script receive visible states; use `aria-pressed` or equivalent state semantics where practical.
- The delete icon button has an explicit accessible label containing the script title or NumberNo.
- The delete control remains a real button and does not trigger the parent selection click.
- Existing labels remain associated with editor and import form controls.

## Verification

- Confirm every batch appears in the horizontal navigation and changes the active script list when selected.
- Confirm selecting a script updates every center editor field.
- Confirm editing script fields still autosaves.
- Confirm the trash icon deletes the intended row and does not accidentally select/delete another script.
- Confirm Add, Duplicate, Move, top search, top status selector, and top import shortcut are absent.
- Confirm all Google Sheets config fields and actions still function as before.
- Confirm desktop layout has three columns and narrow layouts stack without clipped controls.
- Run the repository's existing typecheck/build/lint commands applicable to the dashboard.
