# Dashboard UI Restructure Design

## Goal

Restructure the Gemini Auto Flow dashboard into the `Automation Control Center` visual model described in `docs/design/Gemini_Auto_Flow_UI_Design_System.md` and reflected by the provided reference images.

The work should change the dashboard-wide UI structure, not only repaint individual controls. The existing data hooks and workflow behavior should remain intact unless a layout change requires small presentation-level adjustments.

## Selected Approach

Use the **Foundation + Page Restructure** approach.

1. Establish the dashboard shell and shared visual foundation first.
2. Migrate current pages into the new layout patterns using existing state and hooks.
3. Keep the implementation incremental and low-risk by avoiding a large rewrite of business logic.

This balances visual fidelity with maintainability.

## Design Principles

- Use a left sidebar instead of the current top navigation.
- Use the documented dark SaaS palette: navy app background, sidebar surface, card surface, and nested child surface.
- Prefer compact data-first layouts over large card-only rows.
- Make status visible with consistent icon, label, and color.
- Use primary buttons only for primary actions such as save, create, import, and start run.
- Reduce visible destructive/actions noise by using icon buttons or compact secondary actions.
- Preserve current functionality while improving structure.

## Global Shell

### App Layout

The root dashboard should become a two-column application shell:

- Fixed-width left sidebar.
- Main content area with page header and active page content.

The shell should replace the current top header navigation.

### Sidebar

Sidebar content:

- Brand: `Gemini Auto Flow`.
- Navigation items with grouped semantics:
  - Dashboard
  - Profiles
  - Scripts
  - Google Sheets
  - Run
  - Results
  - Run Calendar

Each item should use consistent icon-sized affordances or icon placeholders if no icon package is available. The active item should use selected background, primary blue text/icon, and a left active indicator.

### Main Content

Each page should follow:

- Page title.
- Short description.
- Optional primary action aligned to the right.
- Content panels below.

## Design Tokens

Add CSS variables based on the design system:

- Background: `--bg-app`, `--bg-sidebar`, `--bg-surface`, `--bg-surface-2`, `--bg-hover`, `--bg-selected`.
- Primary: `--primary-400`, `--primary-500`, `--primary-600`, `--primary-700`.
- Status: success, warning, danger, violet.
- Text: primary, secondary, muted, disabled, link.
- Border, radius, spacing tokens.

The existing `.panel`, `.card`, `.button`, `.field`, `.section-title`, and `.section-subtitle` classes should be updated to use these tokens.

## Shared UI Patterns

Create or standardize these reusable patterns in CSS and/or small React helpers:

- `PageHeader`-style layout through classes or component.
- Metric cards for dashboard summaries.
- Compact panels/cards with 12px radius.
- Compact tables with 48–56px rows.
- Status badges for completed, failed, skipped, pending, running, enabled, disabled.
- Icon/action buttons for edit, copy, delete, view, and more actions.
- Empty states with explanation and next action.

## Page-Level Structure

### Dashboard

Add or expose a Dashboard screen as the default landing page.

Content:

- KPI cards: profiles, batches/scripts, runs today or recent run count, total results/success/failure where available.
- Recent runs panel.
- Quick actions panel.
- System/status panel if data is available.

Dashboard must remain a summary screen, not a detailed configuration form.

### Profiles

Keep the current profile management logic, but restructure visually toward:

- Profile list/table.
- Editor/detail area.
- Stage/output settings grouped instead of one long visual block.

Primary action: create/save profile.

Secondary actions: edit, duplicate, delete, enable/disable.

### Scripts

Structure as list/editor:

- Left or top script/batch list.
- Main editor/table for scripts in selected batch.
- Compact table rows for script metadata and status.
- More-actions style for secondary actions where practical.

### Google Sheets

Present as a wizard-like layout:

1. Connect/config.
2. Map columns.
3. Preview/validate.
4. Import.

The implementation can keep one React page but should visually separate these steps and reduce the impression of a long unstructured form.

### Run

Use the documented two-column pattern:

- Run Configuration.
- Launch Preview.

The primary action should be `Start Run`. Runtime progress should be status-first and compact.

### Results

Use master-detail:

- Runs column.
- Jobs column.
- Result Detail panel.

The detail panel should show submitted content, stage responses, final output, copy/export/write-back/open actions where available.

This should replace overly wide runtime/result rows with focused detail inspection.

### Run Calendar

Keep the page if schedule/history is present, but restyle it to match the shell and status system. It may remain a calendar/history support screen.

## Constraints

- Do not remove existing user workflows.
- Do not introduce a new UI library unless already present or clearly necessary.
- Avoid large business-logic rewrites.
- Keep existing hooks as the source of data.
- Preserve Vietnamese/English labels currently used where they reflect app behavior, but normalize UI structure.

## Acceptance Criteria

- The dashboard uses a sidebar shell rather than top navigation.
- CSS tokens from the design system drive the app colors, spacing, radius, and status visuals.
- The main screens visually align with the provided dark SaaS reference images.
- Results uses a clear `Runs | Jobs | Result Detail` master-detail layout.
- Run uses a `Run Configuration | Launch Preview` structure.
- Google Sheets is visually grouped as a 4-step import flow.
- Existing functional controls remain reachable.
- No page should look like an unrelated style from the old header/card-only layout.

## Verification Plan

- Run TypeScript/build checks available in the project.
- Inspect lints if configured.
- Launch the dashboard locally if scripts are available and visually verify the major pages.
- Check that navigation hashes still work for all pages.
