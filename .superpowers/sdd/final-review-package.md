# Final Review Package

## Commits
d0751d4 fix: scope Results action alignment
eade547 style: add selected run script cards
8dc2346 feat: scope result scripts to selected run

## Stat
 src/app/styles.css                  | 143 ++++++++
 src/dashboard/pages/ResultsPage.tsx | 637 +++++++++++-------------------------
 2 files changed, 332 insertions(+), 448 deletions(-)

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
index a8c7d09..e39fcf0 100644
--- a/src/dashboard/pages/ResultsPage.tsx
+++ b/src/dashboard/pages/ResultsPage.tsx
@@ -1,32 +1,25 @@
-import { useMemo, useState } from 'react';
+import { useState } from 'react';
 import type React from 'react';
 import type { JobStatus } from '../../core/models';
 import type { CollectOutputMode } from '../../shared/messaging/contracts';
 import { useResults } from '../hooks/useResults';
 
 function formatDate(value: string | null): string {
   if (!value) {
     return 'GÇö';
   }
 
   const date = new Date(value);
   return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
 }
 
-function trimText(value: string, max = 180): string {
-  if (value.length <= max) {
-    return value;
-  }
-  return `${value.slice(0, max)}GÇª`;
-}
-
 function getWriteBackDisabledReason(job: { output: string; scriptTitle: string }): string | null {
   if (!job.output.trim()) {
     return 'Disabled: output is empty. Click Lß¦Ñy scripts or edit output first.';
   }
   if (!job.scriptTitle.trim()) {
     return 'Disabled: video title is empty. Fill the script title/video title first.';
   }
   return null;
 }
 
@@ -57,532 +50,280 @@ function getStatusBadgeClass(status: string): string {
 function hasVietnameseText(value: string): boolean {
   return /[-â+ó-æ+¬+¦¦í¦¦+í+áß¦ú+úß¦íß¦Ñß¦ºß¦¬ß¦½ß¦¡ß¦»ß¦¦ß¦¦ß¦¦ß¦++¬+¿ß¦+ß¦+ß¦¦ß¦+ß+üß+âß+àß+ç+¡+¼ß+ë-¬ß+ï+¦+¦ß+Å+¦ß+ìß+æß+ôß+òß+ùß+Öß+¢ß+¥ß+ƒß+íß+ú+¦+¦ß+º+¬ß+Ñß+¬ß+½ß+¡ß+»ß+¦++ß+¦ß++ß+¦ß+¦]/i.test(value);
 }
 
 export function ResultsPage() {
   const {
     runs,
     loading,
     selectedRunBundle,
     selectedRunId,
-    selectedJobResult,
-    selectedJobResultId,
-    selectedStageResults,
     copyMessage,
     writingBackJobIds,
     setSelectedRunId,
-    setSelectedJobResultId,
     copyText,
     updateRuntimeJob,
     addRuntimeJob,
     deleteRuntimeJob,
     deleteRun,
     collectScripts,
     relinkTabFromUrl,
     submitManualTextToJob,
     writeBackRuntimeJob,
     canCollectScripts,
   } = useResults();
 
   const [outputModal, setOutputModal] = useState<{ runId: string; scriptId: string; title: string; content: string } | null>(null);
   const [manualSubmitTextByJob, setManualSubmitTextByJob] = useState<Record<string, string>>({});
   const [collectModeByJob, setCollectModeByJob] = useState<Record<string, CollectOutputMode>>({});
 
-  const groupedRuntimeJobCards = useMemo(() => {
-    if (!selectedRunBundle) {
-      return [];
-    }
-
-    const relatedRuns = runs
-      .filter((bundle) => bundle.run.batchId === selectedRunBundle.run.batchId)
-      .map((bundle) => bundle.run);
-    type RuntimeChild = { runId: string; job: (typeof selectedRunBundle.run.jobs)[number] };
-    const groups = new Map<string, { key: string; numberNo: string | null; scriptTitle: string; children: RuntimeChild[] }>();
-
-    for (const run of relatedRuns) {
-      for (const job of run.jobs) {
-        const key = job.source?.sourceRowNumber ? `row-${job.source.sourceRowNumber}` : `${job.scriptId || job.scriptTitle}`;
-        const current = groups.get(key) ?? {
-          key,
-          numberNo: job.scriptNumberNo || null,
-          scriptTitle: job.scriptTitle,
-          children: [],
-        };
-        const existingChildIndex = current.children.findIndex((child) => child.runId === run.id && child.job.scriptId === job.scriptId);
-        if (existingChildIndex >= 0) {
-          current.children[existingChildIndex] = { runId: run.id, job };
-        } else {
-          current.children.push({ runId: run.id, job });
-        }
-        current.scriptTitle = current.scriptTitle || job.scriptTitle;
-        current.numberNo = current.numberNo || job.scriptNumberNo || null;
-        groups.set(key, current);
-      }
-    }
-
-    return Array.from(groups.values()).map((group) => ({
-      ...group,
-      children: group.children.sort((left, right) => {
-        const leftField = left.job.inputField ?? 'content';
-        const rightField = right.job.inputField ?? 'content';
-        if (leftField !== rightField) {
-          return leftField === 'content' ? -1 : 1;
-        }
-        return left.job.order - right.job.order;
-      }),
-    }));
-  }, [runs, selectedRunBundle]);
-
-  const runSummary = useMemo(() => {
-    if (!selectedRunBundle) {
-      return null;
-    }
-
-    const { run, jobResults } = selectedRunBundle;
-    return {
-      totalJobs: run.jobs.length,
-      completedJobs: jobResults.filter((job) => job.status === 'completed').length,
-      failedJobs: jobResults.filter((job) => job.status === 'failed').length,
-      skippedJobs: jobResults.filter((job) => job.status === 'skipped').length,
-    };
-  }, [selectedRunBundle]);
-
   if (loading) {
     return (
       <section className="panel card">
         <h2 className="section-title">Loading results...</h2>
       </section>
     );
   }
 
   if (runs.length === 0) {
     return (
       <section className="panel card" style={{ minHeight: 320 }}>
         <h2 className="section-title">Results</h2>
         <p className="section-subtitle">No run data yet. Run a flow to populate this view.</p>
       </section>
     );
   }
 
   return (
     <div className="section-stack">
-      <div className="master-detail-grid master-detail-grid--results">
-        <section className="panel card section-stack">
-          <div>
-            <h2 className="section-title">Runs</h2>
-            <p className="section-subtitle">Select a run to inspect saved job results and runtime launch records.</p>
+      <div className="results-filter-bar panel">
+        <input type="search" placeholder="Search runs by name or ID..." aria-label="Search runs by name or ID" />
+        <select aria-label="Filter by profile" defaultValue="all-profiles">
+          <option value="all-profiles">All profiles</option>
+          {runs.map(({ run }) => (
+            <option key={run.id} value={run.profileSnapshot.name}>{run.profileSnapshot.name}</option>
+          ))}
+        </select>
+        <select aria-label="Filter by status" defaultValue="all-status">
+          <option value="all-status">All status</option>
+          <option value="completed">Completed</option>
+          <option value="running">Running</option>
+          <option value="failed">Failed</option>
+          <option value="skipped">Skipped</option>
+        </select>
+        <input type="text" aria-label="Date range" value="Oct 1, 2026 GÇô Oct 6, 2026" readOnly />
+        <button type="button" className="button secondary">Clear</button>
+      </div>
+
+      <div className="results-console-grid">
+        <section className="panel card section-stack results-run-list-panel">
+          <div className="section-toolbar">
+            <h2 className="section-title">Runs ({runs.length})</h2>
+            <select aria-label="Sort runs" defaultValue="newest" className="compact-select">
+              <option value="newest">Newest first</option>
+              <option value="oldest">Oldest first</option>
+            </select>
           </div>
-          <div style={{ display: 'grid', gap: 10, maxHeight: '70vh', overflowY: 'auto' }}>
+          <div className="results-run-list">
             {runs.map(({ run, jobResults }) => {
               const isActive = run.id === selectedRunId;
               return (
-                <div key={run.id} className="panel" style={{ borderRadius: 16, padding: 12, display: 'grid', gap: 8 }}>
-                  <button
-                    type="button"
-                    className={`button secondary ${isActive ? 'is-selected' : ''}`}
-                    onClick={() => setSelectedRunId(run.id)}
-                    style={{ textAlign: 'left', display: 'grid', gap: 6, padding: 14 }}
-                  >
-                    <strong>{run.profileSnapshot.name}</strong>
-                      <span style={{ fontSize: 12, color: '#bfd2f5' }}>Run ID: {run.id}</span>
-                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
-                      <span className={getStatusBadgeClass(run.status)}>{run.status}</span>
-                      <span style={{ fontSize: 12, color: '#9fb1cd' }}>Jobs saved: {jobResults.length}/{run.jobs.length}</span>
+                <article key={run.id} className={`results-run-card ${isActive ? 'active' : ''}`}>
+                  <button type="button" onClick={() => setSelectedRunId(run.id)}>
+                    <span className="results-run-card-title">{run.profileSnapshot.name}</span>
+                    <span className="results-run-card-id">{run.id}</span>
+                    <span className="results-run-card-meta">
+                      <span>{jobResults.length}/{run.jobs.length} scripts</span>
+                      <span>{formatDate(run.createdAt)}</span>
                     </span>
-                    <span style={{ fontSize: 12, color: '#9fb1cd' }}>Started: {formatDate(run.createdAt)}</span>
-                  </button>
-                  <button type="button" className="button secondary" onClick={() => deleteRun(run.id)}>
-                    Delete run
                   </button>
-                </div>
+                  <div className="results-run-card-side">
+                    <span className={getStatusBadgeClass(run.status)}>{run.status}</span>
+                    <button type="button" className="icon-button" onClick={() => deleteRun(run.id)} title="Delete run" aria-label="Delete run">+ù</button>
+                  </div>
+                </article>
               );
             })}
           </div>
         </section>
 
-        <section className="panel card section-stack">
-          <div>
-            <h2 className="section-title">Job Results</h2>
-            <p className="section-subtitle">Final outputs for each script in the selected run.</p>
-          </div>
-
-          {selectedRunBundle && runSummary ? (
-            <>
-              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
-                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
-                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Run status</div>
-                  <span className={getStatusBadgeClass(selectedRunBundle.run.status)}>{selectedRunBundle.run.status}</span>
-                </div>
-                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
-                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Jobs</div>
-                  <strong>{runSummary.completedJobs}/{runSummary.totalJobs} completed</strong>
-                </div>
-                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
-                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Failed</div>
-                  <strong>{runSummary.failedJobs}</strong>
-                </div>
-                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
-                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Skipped</div>
-                  <strong>{runSummary.skippedJobs}</strong>
-                </div>
-              </div>
-
-              <div style={{ display: 'grid', gap: 10, maxHeight: '52vh', overflowY: 'auto' }}>
-                {selectedRunBundle.jobResults.map((jobResult) => {
-                  const isActive = jobResult.id === selectedJobResultId;
-                  return (
-                    <button
-                      key={jobResult.id}
-                      type="button"
-                      className={`button secondary ${isActive ? 'is-selected' : ''}`}
-                      onClick={() => setSelectedJobResultId(jobResult.id)}
-                      style={{ textAlign: 'left', display: 'grid', gap: 6, padding: 14 }}
-                    >
-                      <strong>{jobResult.scriptId}</strong>
-                      <span className={getStatusBadgeClass(jobResult.status)} style={{ width: 'fit-content' }}>{jobResult.status}</span>
-                      <span style={{ fontSize: 12, color: '#9fb1cd' }}>
-                        Final output: {jobResult.finalOutput ? trimText(jobResult.finalOutput, 90) : 'No output yet'}
-                      </span>
-                      <span style={{ fontSize: 12, color: '#9fb1cd' }}>Finished: {formatDate(jobResult.endedAt)}</span>
-                    </button>
-                  );
-                })}
-              </div>
-            </>
-          ) : null}
-        </section>
-
-        <section className="panel card section-stack">
-          <div>
-            <h2 className="section-title">Result Detail</h2>
-            <p className="section-subtitle">View final output and each stage response for the selected script.</p>
-          </div>
-
-          {copyMessage ? (
-            <div className="badge" style={{ width: 'fit-content' }}>{copyMessage}</div>
-          ) : null}
-
-          {!selectedJobResult ? (
-            <div className="panel" style={{ borderRadius: 16, padding: 16 }}>
-              No job result selected.
+        <section className="panel card section-stack results-main-panel">
+          {!selectedRunBundle ? (
+            <div className="empty-state results-script-empty">
+              <h3>No run selected</h3>
+              <p>Select a Run to inspect its runtime scripts.</p>
             </div>
           ) : (
             <>
-              <div className="panel" style={{ borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
-                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
-                  <div>
-                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Script</div>
-                    <strong>{selectedJobResult.scriptId}</strong>
-                  </div>
-                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
-                    <button
-                      type="button"
-                      className="button secondary"
-                      onClick={() => copyText(selectedJobResult.finalOutput, `Copied final output for ${selectedJobResult.scriptId}.`)}
-                      disabled={!selectedJobResult.finalOutput}
-                    >
-                      Copy output
-                    </button>
+              <header className="results-selected-run">
+                <div>
+                  <div className="results-title-row">
+                    <h2>{selectedRunBundle.run.profileSnapshot.name}</h2>
+                    <span className={getStatusBadgeClass(selectedRunBundle.run.status)}>{selectedRunBundle.run.status}</span>
                   </div>
+                  <p>Run ID: {selectedRunBundle.run.id}</p>
                 </div>
-                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
-                  <div>
-                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Status</div>
-                    <span className={getStatusBadgeClass(selectedJobResult.status)}>{selectedJobResult.status}</span>
-                  </div>
-                  <div>
-                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Started</div>
-                    <strong>{formatDate(selectedJobResult.startedAt)}</strong>
-                  </div>
-                  <div>
-                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Finished</div>
-                    <strong>{formatDate(selectedJobResult.endedAt)}</strong>
+                <div className="results-selected-run-actions">
+                  <div className="results-selected-run-meta">
+                    <span>{selectedRunBundle.run.jobs.length} scripts</span>
+                    <span>{formatDate(selectedRunBundle.run.createdAt)}</span>
                   </div>
+                  <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>Add row</button>
                 </div>
-                {selectedJobResult.errorMessage ? (
-                  <div style={{ color: '#fca5a5', fontSize: 13 }}>Error: {selectedJobResult.errorMessage}</div>
-                ) : null}
-                <div className="field">
-                  <label>Final output</label>
-                  <textarea readOnly value={selectedJobResult.finalOutput} rows={8} />
-                </div>
-              </div>
-
-              <div style={{ display: 'grid', gap: 12 }}>
-                {selectedStageResults.map((stageResult, index) => (
-                  <article key={stageResult.id} className="panel" style={{ borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
-                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
-                      <div>
-                        <div style={{ fontSize: 12, color: '#9fb1cd' }}>Stage {index + 1}</div>
-                        <strong>{stageResult.stageName}</strong>
-                      </div>
-                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
-                        <span className={getStatusBadgeClass(stageResult.status)}>{stageResult.status}</span>
-                        <button
-                          type="button"
-                          className="button secondary"
-                          onClick={() => copyText(stageResult.response, `Copied stage ${stageResult.stageName} response.`)}
-                          disabled={!stageResult.response}
-                        >
-                          Copy stage output
-                        </button>
-                      </div>
-                    </div>
-
-                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
-                      <div>
-                        <div style={{ fontSize: 12, color: '#9fb1cd' }}>Started</div>
-                        <strong>{formatDate(stageResult.startedAt)}</strong>
-                      </div>
-                      <div>
-                        <div style={{ fontSize: 12, color: '#9fb1cd' }}>Finished</div>
-                        <strong>{formatDate(stageResult.endedAt)}</strong>
-                      </div>
-                    </div>
+              </header>
 
-                    <div className="field">
-                      <label>Stage input</label>
-                      <textarea readOnly value={stageResult.input} rows={4} />
-                    </div>
-                    <div className="field">
-                      <label>Stage response</label>
-                      <textarea readOnly value={stageResult.response} rows={8} />
-                    </div>
-                  </article>
-                ))}
-              </div>
+              {selectedRunBundle.run.jobs.length === 0 ? (
+                <div className="empty-state results-script-empty">
+                  <h3>No runtime scripts</h3>
+                  <p>This Run does not contain any runtime scripts yet.</p>
+                  <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>Add row</button>
+                </div>
+              ) : (
+                <div className="results-script-list">
+                  {selectedRunBundle.run.jobs.map((job, index) => {
+                    const runId = selectedRunBundle.run.id;
+                    const jobKey = `${runId}:${job.scriptId}`;
+                    const collectMode = collectModeByJob[jobKey] ?? 'japanese-scripts';
+                    const collectEnabled = canCollectScripts(job);
+                    const writeBackDisabledReason = getWriteBackDisabledReason(job);
+                    const isWritingBack = writingBackJobIds.includes(jobKey);
+                    const canSubmitTextToUrl = job.profileName.trim().toUpperCase().startsWith('BTV');
+
+                    return (
+                      <article key={jobKey} className="panel results-script-card">
+                        <header className="results-script-card-header">
+                          <div>
+                            <div className="results-title-row">
+                              <h3>Script {index + 1}</h3>
+                              <span className={getStatusBadgeClass(job.status)}>{job.status}</span>
+                            </div>
+                            <p><strong>{job.scriptTitle || 'Untitled script'}</strong> -+ Input: {job.inputField ?? 'content'}</p>
+                            <p>
+                              Source row: {job.source?.sourceRowNumber ?? job.scriptNumberNo ?? 'GÇö'}
+                              {job.source?.videoTitle ? ` -+ Video: ${job.source.videoTitle}` : ''}
+                            </p>
+                          </div>
+                          <button type="button" className="button secondary" onClick={() => void deleteRuntimeJob(runId, job.scriptId)}>Delete row</button>
+                        </header>
+
+                        <div className="results-script-grid">
+                          <section className="results-script-section">
+                            <h4>Script identity</h4>
+                            <label className="field">
+                              <span>Profile name</span>
+                              <input style={cellInputStyle} value={job.profileName} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { profileName: event.target.value })} />
+                            </label>
+                            <label className="field">
+                              <span>Script title</span>
+                              <input style={cellInputStyle} value={job.scriptTitle} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { scriptTitle: event.target.value })} />
+                            </label>
+                            {(job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl) ? (
+                              <a href={job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl} target="_blank" rel="noreferrer">Open profile URL</a>
+                            ) : <span className="results-script-help">No profile URL.</span>}
+                          </section>
+
+                          <section className="results-script-section">
+                            <h4>Runtime</h4>
+                            <label className="field">
+                              <span>Status</span>
+                              <select style={cellInputStyle} value={job.status} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { status: event.target.value as JobStatus })}>
+                                <option value="pending">pending</option>
+                                <option value="launching">launching</option>
+                                <option value="submitted">submitted</option>
+                                <option value="completed">completed</option>
+                                <option value="failed">failed</option>
+                                <option value="stopped">stopped</option>
+                                <option value="skipped">skipped</option>
+                              </select>
+                            </label>
+                            <label className="field">
+                              <span>Tab ID</span>
+                              <input type="number" style={cellInputStyle} value={job.tabId ?? ''} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { tabId: event.target.value ? Number(event.target.value) : null })} />
+                            </label>
+                            <div className="results-script-help">Submitted: {formatDate(job.submittedAt)}</div>
+                            {job.currentTabUrl ? <a href={job.currentTabUrl} target="_blank" rel="noreferrer">{job.currentTabUrl}</a> : <span className="results-script-help">{job.tabId ? 'Will sync from real running tab' : 'No live tab yet'}</span>}
+                            <div className="results-script-actions">
+                              <button type="button" className="button secondary" onClick={() => void relinkTabFromUrl(runId, job.scriptId)} disabled={!(job.currentTabUrl || job.url)}>Open &amp; relink</button>
+                            </div>
+                            {canSubmitTextToUrl ? (
+                              <>
+                                <label className="field">
+                                  <span>Manual submit text</span>
+                                  <textarea style={cellTextareaStyle} rows={3} value={manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT} onChange={(event) => setManualSubmitTextByJob((current) => ({ ...current, [jobKey]: event.target.value }))} placeholder="Manual text to submit into this current URL" />
+                                </label>
+                                <button type="button" className="button secondary" disabled={!(job.currentTabUrl || job.url) || !(manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT).trim()} onClick={() => void submitManualTextToJob(runId, job.scriptId, manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT)}>Submit text to URL</button>
+                              </>
+                            ) : null}
+                          </section>
+
+                          <section className="results-script-section results-script-section-wide">
+                            <h4>Output</h4>
+                            <label className="field">
+                              <span>Collection mode</span>
+                              <select style={cellInputStyle} value={collectMode} onChange={(event) => setCollectModeByJob((current) => ({ ...current, [jobKey]: event.target.value as CollectOutputMode }))}>
+                                <option value="japanese-scripts">Japanese scripts only</option>
+                                <option value="full-response">Full response</option>
+                              </select>
+                            </label>
+                            <div className="results-script-actions">
+                              <button type="button" className="button secondary" onClick={() => void collectScripts(runId, job.scriptId, collectMode)} disabled={!collectEnabled}>Lß¦Ñy scripts</button>
+                              <span className="results-script-help">{collectEnabled ? 'Ready to collect from running tab.' : 'Enabled after tab is submitted and tab ID exists.'}</span>
+                            </div>
+                            <label className="field">
+                              <span>Output</span>
+                              <textarea style={cellTextareaStyle} value={job.output} rows={7} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { output: event.target.value })} />
+                            </label>
+                            <div className="badge" style={{ width: 'fit-content' }}>{job.output.length} chars</div>
+                            {collectMode === 'japanese-scripts' && hasVietnameseText(job.output) ? <div style={{ color: '#fbbf24', fontSize: 11 }}>Ph+ít hiß+çn tiß¦+ng Viß+çt trong output Japanese scripts only.</div> : null}
+                            <div className="results-script-actions">
+                              <button type="button" className="button secondary" onClick={() => setOutputModal({ runId, scriptId: job.scriptId, title: `${job.scriptId} -+ ${job.scriptTitle}`, content: job.output || '' })}>View output</button>
+                              <button type="button" className="button secondary" onClick={() => void copyText(job.output, `Copied output for ${job.scriptId}.`)} disabled={!job.output}>Copy output</button>
+                              <button type="button" className="button secondary" onClick={() => void writeBackRuntimeJob(runId, job.scriptId)} disabled={Boolean(writeBackDisabledReason) || isWritingBack} title={isWritingBack ? 'Writing output to Google Sheet...' : (writeBackDisabledReason ?? 'Write output back to Google Sheet')}>{isWritingBack ? 'Writing to Sheet...' : 'Write back to Sheet'}</button>
+                            </div>
+                            <div className="results-script-help" style={{ color: writeBackDisabledReason ? '#fca5a5' : undefined }}>{isWritingBack ? 'Processing: resolving row and writing output...' : (writeBackDisabledReason ?? `Sheet: ${job.sheetWriteback.status}${job.sheetWriteback.targetRowNumber ? ` -+ row ${job.sheetWriteback.targetRowNumber}` : ''}${job.sheetWriteback.targetColumn ? ` -+ col ${job.sheetWriteback.targetColumn}` : ''}`)}</div>
+                            {job.sheetWriteback.message ? <div className="results-script-help" style={{ color: job.sheetWriteback.status === 'written' ? '#86efac' : '#fca5a5' }}>{job.sheetWriteback.message}</div> : null}
+                          </section>
+
+                          <section className="results-script-section results-script-section-wide">
+                            <h4>Error</h4>
+                            <label className="field">
+                              <span>Error message</span>
+                              <textarea style={cellTextareaStyle} value={job.errorMessage ?? ''} rows={3} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { errorMessage: event.target.value || null })} />
+                            </label>
+                          </section>
+                        </div>
+                      </article>
+                    );
+                  })}
+                </div>
+              )}
             </>
           )}
         </section>
       </div>
 
-      <section className="panel card" style={{ display: 'grid', gap: 16 }}>
-        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
-          <div>
-            <h2 className="section-title">Launch runtime table</h2>
-            <p className="section-subtitle">Manage runtime records here. Current tab URL is the real conversation URL, and output is only collected when you click the button.</p>
-          </div>
-          {selectedRunBundle ? (
-            <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>
-              Add row
-            </button>
-          ) : null}
-        </div>
-
-        {!selectedRunBundle ? (
-          <div className="panel" style={{ borderRadius: 16, padding: 16 }}>
-            No run selected.
-          </div>
-        ) : (
-          <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
-            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: 1280 }}>
-              <thead>
-                <tr style={{ textAlign: 'left' }}>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>RowNumber</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Profile</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Script</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Status</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Tab ID</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Current Tab URL</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Submitted</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Output</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Error</th>
-                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Actions</th>
-                </tr>
-              </thead>
-              <tbody>
-                {groupedRuntimeJobCards.map((group) => (
-                  <tr key={group.key}>
-                    <td colSpan={10} style={{ padding: 0 }}>
-                      <div className="panel" style={{ borderRadius: 16, padding: 12, display: 'grid', gap: 12 }}>
-                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
-                          <div>
-                            <strong>{group.scriptTitle}</strong>
-                            <div style={{ color: '#9fb1cd', fontSize: 12 }}>RowNumber: {group.numberNo ?? 'null'}</div>
-                          </div>
-                          <span className="badge">{group.children.length} profile run(s)</span>
-                        </div>
-                        {group.children.map(({ runId, job }) => {
-                          const collectEnabled = canCollectScripts(job);
-                          const writeBackDisabledReason = getWriteBackDisabledReason(job);
-                          const isWritingBack = writingBackJobIds.includes(`${runId}:${job.scriptId}`);
-                          const canSubmitTextToUrl = job.profileName.trim().toUpperCase().startsWith('BTV');
-                          return (
-                            <div
-                              key={`${runId}:${job.scriptId}`}
-                              style={{
-                                display: 'grid',
-                                gridTemplateColumns: '0.7fr 1.1fr 1.4fr 0.9fr 0.8fr 1.5fr 0.8fr 1.2fr 1fr 0.9fr',
-                                gap: 12,
-                                alignItems: 'start',
-                                borderTop: '1px solid rgba(148, 163, 184, 0.12)',
-                                paddingTop: 12,
-                              }}
-                            >
-                              <div style={{ color: '#bfd0ea', fontSize: 13, paddingTop: 10 }}>{job.inputField ?? 'content'}</div>
-                              <div style={{ display: 'grid', gap: 8 }}>
-                                <input style={cellInputStyle} value={job.profileName} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { profileName: event.target.value })} />
-                                {(job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl) ? (
-                                  <a href={job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all', fontSize: 12 }}>Open profile URL</a>
-                                ) : null}
-                              </div>
-                              <div style={{ display: 'grid', gap: 8 }}>
-                                <input style={cellInputStyle} value={job.scriptTitle} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { scriptTitle: event.target.value })} />
-                                <div style={{ color: '#9fb1cd', fontSize: 12 }}>Run ID: {runId}</div>
-                                {job.source?.videoTitle ? <div style={{ color: '#bfdbfe', fontSize: 12 }}>Video title: {job.source.videoTitle}</div> : null}
-                              </div>
-                              <div style={{ display: 'grid', gap: 8 }}>
-                                <span className={getStatusBadgeClass(job.status)} style={{ width: 'fit-content' }}>{job.status}</span>
-                                <select style={cellInputStyle} value={job.status} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { status: event.target.value as JobStatus })}>
-                                  <option value="pending">pending</option>
-                                  <option value="launching">launching</option>
-                                  <option value="submitted">submitted</option>
-                                  <option value="completed">completed</option>
-                                  <option value="failed">failed</option>
-                                  <option value="stopped">stopped</option>
-                                  <option value="skipped">skipped</option>
-                                </select>
-                              </div>
-                              <div>
-                                <input style={cellInputStyle} value={job.tabId ?? ''} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { tabId: event.target.value ? Number(event.target.value) : null })} />
-                              </div>
-                              <div style={{ paddingTop: 10, display: 'grid', gap: 8 }}>
-                                {job.currentTabUrl ? (
-                                  <a href={job.currentTabUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all', fontSize: 13 }}>{job.currentTabUrl}</a>
-                                ) : (
-                                  <span style={{ color: '#9fb1cd', fontSize: 12 }}>{job.tabId ? 'Will sync from real running tab' : 'No live tab yet'}</span>
-                                )}
-                                {canSubmitTextToUrl ? (
-                                  <>
-                                    <textarea style={cellTextareaStyle} rows={3} value={manualSubmitTextByJob[`${runId}:${job.scriptId}`] ?? DEFAULT_MANUAL_SUBMIT_TEXT} onChange={(event) => setManualSubmitTextByJob((current) => ({ ...current, [`${runId}:${job.scriptId}`]: event.target.value }))} placeholder="Manual text to submit into this current URL" />
-                                    <button type="button" className="button secondary" disabled={!(job.currentTabUrl || job.url) || !(manualSubmitTextByJob[`${runId}:${job.scriptId}`] ?? DEFAULT_MANUAL_SUBMIT_TEXT).trim()} onClick={() => void submitManualTextToJob(runId, job.scriptId, manualSubmitTextByJob[`${runId}:${job.scriptId}`] ?? DEFAULT_MANUAL_SUBMIT_TEXT)}>Submit text to URL</button>
-                                  </>
-                                ) : null}
-                              </div>
-                              <div style={{ color: '#bfd0ea', fontSize: 12, paddingTop: 10 }}>{formatDate(job.submittedAt)}</div>
-                              <div style={{ display: 'grid', gap: 8 }}>
-                                <textarea style={cellTextareaStyle} value={job.output} rows={5} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { output: event.target.value })} />
-                                <div className="badge" style={{ width: 'fit-content' }}>{job.output.length} chars</div>
-                                {(collectModeByJob[`${runId}:${job.scriptId}`] ?? 'japanese-scripts') === 'japanese-scripts' && hasVietnameseText(job.output) ? (
-                                  <div style={{ color: '#fbbf24', fontSize: 11 }}>Ph+ít hiß+çn tiß¦+ng Viß+çt trong output Japanese scripts only.</div>
-                                ) : null}
-                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
-                                  <button type="button" className="button secondary" onClick={() => setOutputModal({ runId, scriptId: job.scriptId, title: `${job.scriptId} -+ ${job.scriptTitle}`, content: job.output || '' })}>View output</button>
-                                  <button type="button" className="button secondary" onClick={() => void copyText(job.output, `Copied output for ${job.scriptId}.`)} disabled={!job.output}>Copy output</button>
-                                </div>
-                              </div>
-                              <div>
-                                <textarea style={cellTextareaStyle} value={job.errorMessage ?? ''} rows={3} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { errorMessage: event.target.value || null })} />
-                              </div>
-                              <div style={{ display: 'grid', gap: 8 }}>
-                                <select style={cellInputStyle} value={collectModeByJob[`${runId}:${job.scriptId}`] ?? 'japanese-scripts'} onChange={(event) => setCollectModeByJob((current) => ({ ...current, [`${runId}:${job.scriptId}`]: event.target.value as CollectOutputMode }))}>
-                                  <option value="japanese-scripts">Japanese scripts only</option>
-                                  <option value="full-response">Full response</option>
-                                </select>
-                                <button type="button" className="button secondary" onClick={() => void collectScripts(runId, job.scriptId, collectModeByJob[`${runId}:${job.scriptId}`] ?? 'japanese-scripts')} disabled={!collectEnabled}>Lß¦Ñy scripts</button>
-                                <div style={{ color: '#9fb1cd', fontSize: 11 }}>{collectEnabled ? 'Ready to collect from running tab.' : 'Enabled after tab is submitted and tab ID exists.'}</div>
-                                <button type="button" className="button secondary" onClick={() => void writeBackRuntimeJob(runId, job.scriptId)} disabled={Boolean(writeBackDisabledReason) || isWritingBack} title={isWritingBack ? 'Writing output to Google Sheet...' : (writeBackDisabledReason ?? 'Write output back to Google Sheet')}>{isWritingBack ? 'Writing to Sheet...' : 'Write back to Sheet'}</button>
-                                <div style={{ color: writeBackDisabledReason ? '#fca5a5' : '#9fb1cd', fontSize: 11 }}>{isWritingBack ? 'Processing: resolving row and writing output...' : (writeBackDisabledReason ?? `Sheet: ${job.sheetWriteback.status}${job.sheetWriteback.targetRowNumber ? ` -+ row ${job.sheetWriteback.targetRowNumber}` : ''}${job.sheetWriteback.targetColumn ? ` -+ col ${job.sheetWriteback.targetColumn}` : ''}`)}</div>
-                                {job.sheetWriteback.message ? <div style={{ color: job.sheetWriteback.status === 'written' ? '#86efac' : '#fca5a5', fontSize: 11 }}>{job.sheetWriteback.message}</div> : null}
-                                <button type="button" className="button secondary" onClick={() => void relinkTabFromUrl(runId, job.scriptId)} disabled={!(job.currentTabUrl || job.url)}>Open & relink</button>
-                                <button type="button" className="button secondary" onClick={() => void deleteRuntimeJob(runId, job.scriptId)}>Delete row</button>
-                              </div>
-                            </div>
-                          );
-                        })}
-                      </div>
-                    </td>
-                  </tr>
-                ))}
-              </tbody>
-            </table>
-          </div>
-        )}
-      </section>
-
       {copyMessage ? (
-        <div
-          role="status"
-          style={{
-            position: 'fixed',
-            right: 24,
-            bottom: 24,
-            zIndex: 1100,
-            maxWidth: 420,
-            padding: '12px 14px',
-            borderRadius: 14,
-            border: '1px solid rgba(96, 165, 250, 0.38)',
-            background: 'rgba(15, 23, 42, 0.96)',
-            color: '#dbeafe',
-            boxShadow: '0 18px 45px rgba(2, 6, 23, 0.42)',
-            fontSize: 13,
-          }}
-        >
+        <div role="status" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1100, maxWidth: 420, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(96, 165, 250, 0.38)', background: 'rgba(15, 23, 42, 0.96)', color: '#dbeafe', boxShadow: '0 18px 45px rgba(2, 6, 23, 0.42)', fontSize: 13 }}>
           {copyMessage}
         </div>
       ) : null}
 
       {outputModal ? (
-        <div
-          role="dialog"
-          aria-modal="true"
-          onClick={() => setOutputModal(null)}
-          style={{
-            position: 'fixed',
-            inset: 0,
-            background: 'rgba(2, 6, 23, 0.72)',
-            display: 'grid',
-            placeItems: 'center',
-            padding: 24,
-            zIndex: 1000,
-          }}
-        >
-          <div
-            className="panel card"
-            onClick={(event) => event.stopPropagation()}
-            style={{
-              width: 'min(960px, 100%)',
-              maxHeight: '85vh',
-              display: 'grid',
-              gap: 16,
-              overflow: 'hidden',
-            }}
-          >
+        <div role="dialog" aria-modal="true" onClick={() => setOutputModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.72)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 1000 }}>
+          <div className="panel card" onClick={(event) => event.stopPropagation()} style={{ width: 'min(960px, 100%)', maxHeight: '85vh', display: 'grid', gap: 16, overflow: 'hidden' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
               <div>
                 <h3 className="section-title" style={{ marginBottom: 6 }}>Full output</h3>
                 <p className="section-subtitle">{outputModal.title}</p>
               </div>
               <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
-                <button
-                  type="button"
-                  className="button"
-                  onClick={() => {
-                    void updateRuntimeJob(outputModal.runId, outputModal.scriptId, { output: outputModal.content });
-                    setOutputModal(null);
-                  }}
-                >
-                  Save output
-                </button>
-                <button type="button" className="button secondary" onClick={() => setOutputModal(null)}>
-                  Close
-                </button>
+                <button type="button" className="button" onClick={() => { void updateRuntimeJob(outputModal.runId, outputModal.scriptId, { output: outputModal.content }); setOutputModal(null); }}>Save output</button>
+                <button type="button" className="button secondary" onClick={() => setOutputModal(null)}>Close</button>
               </div>
             </div>
-            <textarea
-              value={outputModal.content}
-              onChange={(event) => setOutputModal((current) => current ? { ...current, content: event.target.value } : current)}
-              style={{
-                ...cellTextareaStyle,
-                minHeight: 420,
-                maxHeight: '65vh',
-                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
-                whiteSpace: 'pre-wrap',
-                overflow: 'auto',
-              }}
-            />
+            <textarea aria-label="Full output" value={outputModal.content} onChange={(event) => setOutputModal((current) => current ? { ...current, content: event.target.value } : current)} style={{ ...cellTextareaStyle, minHeight: 420, maxHeight: '65vh', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace', whiteSpace: 'pre-wrap', overflow: 'auto' }} />
           </div>
         </div>
       ) : null}
     </div>
   );
 }
