# Task 2 Review Package

## Commits
d0751d4 fix: scope Results action alignment
eade547 style: add selected run script cards

## Stat
 src/app/styles.css                  | 143 ++++++++++++++++++++++++++++++++++++
 src/dashboard/pages/ResultsPage.tsx |   2 +-
 2 files changed, 144 insertions(+), 1 deletion(-)

## Diff
diff --git a/src/app/styles.css b/src/app/styles.css
index 4a6e9ba..1ba7b2b 100644
--- a/src/app/styles.css
+++ b/src/app/styles.css
@@ -766,20 +766,163 @@ a {
 
 .helper-text.strong {
   color: var(--text-primary);
 }
 
 .import-wizard-panel .step-list,
 .config-wizard-panel .step-list {
   gap: var(--space-4);
 }
 
+.results-title-row {
+  display: flex;
+  gap: var(--space-3);
+  align-items: center;
+  flex-wrap: wrap;
+}
+
+.results-title-row h2,
+.results-title-row h3 {
+  margin: 0;
+}
+
+.results-selected-run,
+.results-script-card-header {
+  display: flex;
+  justify-content: space-between;
+  gap: var(--space-4);
+  align-items: flex-start;
+  flex-wrap: wrap;
+  min-width: 0;
+}
+
+.results-selected-run p,
+.results-script-card-header p {
+  margin: 6px 0 0;
+  color: var(--text-secondary);
+  font-size: 13px;
+  overflow-wrap: anywhere;
+}
+
+.results-selected-run-actions {
+  display: flex;
+  align-items: center;
+  justify-content: flex-end;
+  gap: var(--space-3);
+  flex-wrap: wrap;
+}
+
+.results-selected-run-meta {
+  display: flex;
+  gap: var(--space-3);
+  color: var(--text-secondary);
+  font-size: 12px;
+  flex-wrap: wrap;
+}
+
+.results-script-actions {
+  display: flex;
+  gap: var(--space-2);
+  flex-wrap: wrap;
+  align-items: center;
+}
+
+.results-script-list {
+  display: grid;
+  gap: var(--space-4);
+  min-width: 0;
+}
+
+.results-script-card {
+  display: grid;
+  gap: var(--space-4);
+  min-width: 0;
+  padding: var(--space-4);
+  overflow: hidden;
+}
+
+.results-script-card-header > div,
+.results-selected-run > div,
+.results-script-grid,
+.results-script-section,
+.results-script-section .field {
+  min-width: 0;
+}
+
+.results-script-grid {
+  display: grid;
+  grid-template-columns: repeat(2, minmax(0, 1fr));
+  gap: var(--space-4);
+}
+
+.results-script-section {
+  display: grid;
+  align-content: start;
+  gap: var(--space-3);
+  padding: var(--space-4);
+  border: 1px solid var(--border-default);
+  border-radius: var(--radius-lg);
+  background: var(--bg-surface-2);
+}
+
+.results-script-section-wide {
+  grid-column: 1 / -1;
+}
+
+.results-script-section h4 {
+  margin: 0;
+  color: var(--text-primary);
+}
+
+.results-script-section a,
+.results-script-help {
+  overflow-wrap: anywhere;
+  word-break: break-word;
+}
+
+.results-script-section input,
+.results-script-section select,
+.results-script-section textarea {
+  min-width: 0;
+  max-width: 100%;
+}
+
+.results-script-section textarea {
+  min-height: 92px;
+  resize: vertical;
+}
+
+.results-script-help {
+  color: var(--text-secondary);
+  font-size: 12px;
+}
+
+.results-script-empty {
+  min-width: 0;
+  padding: var(--space-6);
+}
+
+@media (max-width: 760px) {
+  .results-script-grid {
+    grid-template-columns: 1fr;
+  }
+
+  .results-script-section-wide {
+    grid-column: auto;
+  }
+
+  .results-selected-run-actions {
+    width: 100%;
+    justify-content: flex-start;
+  }
+}
+
 @media (max-width: 1080px) {
   .app-shell {
     grid-template-columns: 1fr;
   }
 
   .sidebar {
     position: static;
     height: auto;
     grid-template-rows: auto auto auto;
   }
diff --git a/src/dashboard/pages/ResultsPage.tsx b/src/dashboard/pages/ResultsPage.tsx
index befabff..e39fcf0 100644
--- a/src/dashboard/pages/ResultsPage.tsx
+++ b/src/dashboard/pages/ResultsPage.tsx
@@ -131,21 +131,21 @@ export function ResultsPage() {
                   <button type="button" onClick={() => setSelectedRunId(run.id)}>
                     <span className="results-run-card-title">{run.profileSnapshot.name}</span>
                     <span className="results-run-card-id">{run.id}</span>
                     <span className="results-run-card-meta">
                       <span>{jobResults.length}/{run.jobs.length} scripts</span>
                       <span>{formatDate(run.createdAt)}</span>
                     </span>
                   </button>
                   <div className="results-run-card-side">
                     <span className={getStatusBadgeClass(run.status)}>{run.status}</span>
-                    <button type="button" className="icon-button" onClick={() => deleteRun(run.id)} title="Delete run">+ù</button>
+                    <button type="button" className="icon-button" onClick={() => deleteRun(run.id)} title="Delete run" aria-label="Delete run">+ù</button>
                   </div>
                 </article>
               );
             })}
           </div>
         </section>
 
         <section className="panel card section-stack results-main-panel">
           {!selectedRunBundle ? (
             <div className="empty-state results-script-empty">
