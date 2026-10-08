# Scripts Page Three-Column Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Scripts page with horizontal batch navigation and a three-column script list, selected-script editor, and Google Sheets import workspace matching the approved design.

**Architecture:** Keep `useScriptBatch` as the single source of state and behavior. Narrow `ScriptList` and `ScriptEditor` to their approved responsibilities, extract the existing import markup into a focused `SheetImportPanel`, and let `ScriptsPage` compose batch navigation and the responsive workspace. Add page-specific CSS without changing shared storage or import logic.

**Tech Stack:** React 19, TypeScript 6, CSS, Vite 8, ESLint 10.

## Global Constraints

- Preserve script selection and debounced autosave behavior.
- Preserve Google Sheets import, translation, and YouTube extraction behavior.
- Do not change storage models, repositories, or hook persistence logic.
- Remove Add, Duplicate, Move, batch create/delete, batch name editing, and reset controls from the Scripts page.
- Keep only a per-script delete icon in the left list.
- Do not add new dependencies.
- Do not overwrite unrelated working-tree changes.

---

### Task 1: Narrow the Script List and Editor Interfaces

**Files:**
- Modify: `src/dashboard/components/scripts/ScriptList.tsx`
- Modify: `src/dashboard/components/scripts/ScriptEditor.tsx`

**Interfaces:**
- `ScriptList` consumes `scripts`, `selectedScriptId`, `batchName`, `onSelect`, and `onDelete(scriptId: string)`.
- `ScriptEditor` consumes `selectedScript`, `saveState`, `validation`, and `onUpdateScript`.
- Both components remain controlled by `ScriptsPage` and `useScriptBatch`.

- [ ] **Step 1: Record the current verification baseline**

Run: `npm run lint`

Expected: Record whether the existing working tree is clean or contains pre-existing lint failures before changes.

- [ ] **Step 2: Reduce `ScriptListProps` and render compact selectable rows**

Change the interface to remove `onAdd`, `onDuplicate`, `onToggleEnabled`, and `onMove`, and change deletion to target the row explicitly:

```typescript
interface ScriptListProps {
  scripts: Script[];
  selectedScriptId: string | null;
  batchName: string;
  onSelect: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
}
```

Render each script as a wrapper containing a selectable button and a sibling trash button. The trash button must call `event.stopPropagation()` and `onDelete(script.id)`, have `type="button"`, and include an accessible label based on title or NumberNo. Remove all add, duplicate, movement, and enable/disable action buttons. Keep title, NumberNo, character count, status, and selected styling.

- [ ] **Step 3: Reduce `ScriptEditorProps` to script-only editing**

Use this responsibility boundary:

```typescript
interface ScriptEditorProps {
  selectedScript: Script | null;
  saveState: 'idle' | 'saving' | 'saved';
  validation: ReturnType<typeof validateScriptBatch> | null;
  onUpdateScript: (patch: Partial<Script>) => void;
}
```

Remove `batch`, `onChangeBatchName`, `onResetBatch`, the batch-name input, and reset button. Keep the selected-script empty state, autosave status, validation errors, NumberNo, title, availability, character count, and content controls.

- [ ] **Step 4: Run static verification for the expected temporary integration failure**

Run: `npm run build`

Expected: TypeScript reports that `ScriptsPage` still supplies removed props or does not yet supply the new targeted delete callback. This confirms the component boundary changed before page integration.

- [ ] **Step 5: Commit the component boundary change**

```bash
git add src/dashboard/components/scripts/ScriptList.tsx src/dashboard/components/scripts/ScriptEditor.tsx
git commit -m "refactor: simplify scripts list and editor"
```

### Task 2: Extract the Google Sheets Import Panel

**Files:**
- Create: `src/dashboard/components/scripts/SheetImportPanel.tsx`
- Modify: `src/dashboard/pages/ScriptsPage.tsx`

**Interfaces:**
- `SheetImportPanel` consumes the existing import state and callbacks returned by `useScriptBatch`.
- The component does not own persistence or network behavior.

- [ ] **Step 1: Define the import panel props from existing hook values**

Create an explicit props interface containing:

```typescript
interface SheetImportPanelProps {
  importMessage: string;
  importingSheet: boolean;
  translatingSheetTitles: boolean;
  extractingYoutubeScripts: boolean;
  sheetImportForm: SheetImportFormState;
  sheetConfigs: GoogleSheetConfig[];
  selectedSheetConfigId: string;
  updateSheetImportForm: (patch: Partial<SheetImportFormState>) => void;
  saveSheetImportConfig: () => Promise<void>;
  selectSheetConfig: (configId: string) => Promise<void>;
  translateVideoTitlesToVietnamese: () => Promise<void>;
  extractYoutubeScripts: () => Promise<void>;
  importFromGoogleSheet: (
    sheetUrl: string,
    sheetName: string,
    startRow: number,
    endRow: number,
    titleColumn: string,
    contentColumn: string,
    videoTitleColumn: string,
    outputColumn: string,
  ) => Promise<void>;
}
```

If the hook's inferred callbacks return `void | Promise<void>` rather than exactly `Promise<void>`, match their actual signatures instead of wrapping or changing hook behavior.

- [ ] **Step 2: Move the existing import UI without changing behavior**

Move the saved-config selection, mapping fields, row range, Save Config, Import Sheet, Translate, Extract YouTube, disabled/loading expressions, and message rendering from `ScriptsPage` into `SheetImportPanel`. Preserve every existing callback argument and disabled condition.

Use page-specific classes such as `scripts-import-panel`, `scripts-import-groups`, and `scripts-import-actions` to support dense right-column styling.

- [ ] **Step 3: Replace the old inline import card in `ScriptsPage`**

Import and render `SheetImportPanel` with state and handlers directly from `useScriptBatch`. Do not duplicate local state or import logic.

- [ ] **Step 4: Run lint**

Run: `npm run lint`

Expected: Exit code 0, or only the same pre-existing failures recorded in Task 1 with no new errors in `SheetImportPanel.tsx` or `ScriptsPage.tsx`.

- [ ] **Step 5: Commit the extraction**

```bash
git add src/dashboard/components/scripts/SheetImportPanel.tsx src/dashboard/pages/ScriptsPage.tsx
git commit -m "refactor: extract scripts sheet import panel"
```

### Task 3: Compose Batch Navigation and the Three-Column Workspace

**Files:**
- Modify: `src/dashboard/pages/ScriptsPage.tsx`
- Modify: `src/dashboard/components/scripts/ScriptList.tsx`
- Modify: `src/dashboard/components/scripts/ScriptEditor.tsx`

**Interfaces:**
- `ScriptsPage` maps `batches` to batch-tab buttons using `setSelectedBatchId`.
- Targeted deletion adapts the existing selected-script deletion API by selecting the requested row before invoking `deleteScript`.

- [ ] **Step 1: Replace the batch manager card with horizontal navigation**

Render a compact navigation section above the workspace:

```tsx
<nav className="scripts-batch-tabs" aria-label="Script batches">
  {batches.map((item) => {
    const active = item.id === selectedBatchId;
    return (
      <button
        key={item.id}
        type="button"
        className={`scripts-batch-tab ${active ? 'active' : ''}`}
        aria-pressed={active}
        onClick={() => setSelectedBatchId(item.id)}
      >
        <span>{item.name}</span>
        <small>{item.scripts.length} scripts</small>
      </button>
    );
  })}
</nav>
```

Remove New Batch, Delete Batch, dropdown selection, search, status filter, Add Script, and top import shortcut from this page.

- [ ] **Step 2: Compose the three-column workspace**

Render the components in this order inside `scripts-workspace-grid`: `ScriptList`, `ScriptEditor`, `SheetImportPanel`. Pass only the narrowed props from Tasks 1 and 2.

- [ ] **Step 3: Adapt per-row deletion to the existing hook API**

Create a page callback that targets the script before deletion:

```typescript
const handleDeleteScript = (scriptId: string) => {
  setSelectedScriptId(scriptId);
  window.setTimeout(() => {
    void deleteScript();
  }, 0);
};
```

Before keeping this adapter, inspect the hook's `deleteScript` implementation. If it closes over `selectedScriptId`, use a targeted hook callback instead by changing it to `deleteScript(scriptId?: string)` and deleting `scriptId ?? selectedScriptId`; this direct form is preferred because React state updates are asynchronous. Do not rely on a timeout if the hook can safely accept an explicit ID.

- [ ] **Step 4: Remove unused hook destructuring**

Remove `setBatchName`, `createBatch`, `deleteBatch`, `addScript`, `duplicateScript`, `moveScript`, `updateScriptById`, and `resetBatch` from `ScriptsPage` when they are no longer used. Keep the hook exports unchanged unless needed for the targeted deletion correction.

- [ ] **Step 5: Run TypeScript/Vite build**

Run: `npm run build`

Expected: Exit code 0 with no missing/extra prop or unused-symbol TypeScript errors.

- [ ] **Step 6: Commit the page composition**

```bash
git add src/dashboard/pages/ScriptsPage.tsx src/dashboard/components/scripts/ScriptList.tsx src/dashboard/components/scripts/ScriptEditor.tsx src/dashboard/hooks/useScriptBatch.ts
git commit -m "feat: add scripts three-column workspace"
```

Only stage `useScriptBatch.ts` if it was changed for explicit targeted deletion; preserve unrelated edits already present in that file.

### Task 4: Add Responsive Page-Specific Styling

**Files:**
- Modify: `src/app/styles.css`

**Interfaces:**
- Styles target the classes introduced in Tasks 1-3 and reuse existing design tokens.

- [ ] **Step 1: Add desktop batch navigation and workspace grid styles**

Implement:

```css
.scripts-page-layout {
  min-width: 0;
}

.scripts-batch-tabs {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.scripts-workspace-grid {
  display: grid;
  grid-template-columns: minmax(240px, 24fr) minmax(420px, 48fr) minmax(300px, 28fr);
  gap: var(--space-3);
  align-items: stretch;
  min-width: 0;
}
```

Style active/hover/focus states for `.scripts-batch-tab`, using existing color, radius, border, and spacing variables.

- [ ] **Step 2: Style compact script rows and trash buttons**

Add styles for a row wrapper, main selectable area, metadata, active state, status badge, and icon-only delete button. Ensure the delete control is visually distinct on hover/focus and does not create nested buttons.

- [ ] **Step 3: Size the editor and import columns**

Give the list and import panel independent vertical scrolling at desktop workspace height. Let the content textarea fill practical remaining space without forcing horizontal overflow. Use compact import groups and allow action buttons/field grids to wrap.

- [ ] **Step 4: Add responsive breakpoints**

At a medium breakpoint, reduce to a two-column arrangement where practical and let the import panel span the available width. At the project's narrow/mobile breakpoint, set `scripts-workspace-grid` to one column, preserve component order, disable restrictive max heights, and keep batch tabs horizontally scrollable.

- [ ] **Step 5: Run lint and build**

Run: `npm run lint`

Expected: Exit code 0, or only recorded pre-existing lint failures.

Run: `npm run build`

Expected: Exit code 0.

- [ ] **Step 6: Commit styling**

```bash
git add src/app/styles.css
git commit -m "style: add responsive scripts workspace"
```

### Task 5: Browser Verification and Final Review

**Files:**
- Modify only if verification exposes a defect in files from Tasks 1-4.

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: Start the app**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite reports a local URL and remains running.

- [ ] **Step 2: Verify desktop behavior in the browser**

At a desktop viewport, verify:

- Horizontal batch tabs appear above the workspace.
- Selecting a batch changes the scripts shown.
- The left, center, and right panels appear in the approved order.
- Selecting a script updates NumberNo, title, availability, character count, and content in the center.
- Editing a field triggers the existing save-state progression.
- The left row contains only a delete icon as its action.
- Add, Duplicate, Move, batch create/delete, batch dropdown, search, status select, and top import shortcut are absent.
- Every import config field and action remains present.

- [ ] **Step 3: Verify responsive behavior**

At tablet and mobile viewport widths, verify controls do not clip horizontally, panels stack in batch → list → editor → import order on narrow screens, and batch tabs remain horizontally scrollable.

- [ ] **Step 4: Run final automated verification**

Run: `npm run lint`

Expected: Exit code 0, or document exact pre-existing failures and confirm no touched-file errors.

Run: `npm run build`

Expected: Exit code 0.

Run: `git diff --check`

Expected: Exit code 0 with no whitespace errors.

- [ ] **Step 5: Review scope and working tree**

Run: `git status --short`

Expected: Only intended Scripts-page files plus unrelated pre-existing user changes are listed. Inspect `git diff` and confirm no unrelated edits were overwritten.

- [ ] **Step 6: Commit any verification fixes**

```bash
git add src/dashboard/pages/ScriptsPage.tsx src/dashboard/components/scripts/ScriptList.tsx src/dashboard/components/scripts/ScriptEditor.tsx src/dashboard/components/scripts/SheetImportPanel.tsx src/app/styles.css
git commit -m "fix: polish scripts workspace behavior"
```

Skip this commit when browser verification required no fixes.
