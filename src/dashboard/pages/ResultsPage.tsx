import { useState } from 'react';
import type React from 'react';
import type { JobStatus } from '../../core/models';
import type { CollectOutputMode } from '../../shared/messaging/contracts';
import { useResults } from '../hooks/useResults';

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getWriteBackDisabledReason(job: { output: string; scriptTitle: string }): string | null {
  if (!job.output.trim()) {
    return 'Disabled: output is empty. Click Lấy scripts or edit output first.';
  }
  if (!job.scriptTitle.trim()) {
    return 'Disabled: video title is empty. Fill the script title/video title first.';
  }
  return null;
}

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.68)',
  color: '#e2e8f0',
  padding: '10px 12px',
  fontSize: 13,
  boxSizing: 'border-box',
};

const cellTextareaStyle: React.CSSProperties = {
  ...cellInputStyle,
  minHeight: 76,
  resize: 'vertical',
};

const DEFAULT_MANUAL_SUBMIT_TEXT = 'từ tiêu đề này hãy viết mô tả (220 ký tự trong đó phải đảm bảo phải viết được keywords chính) tag + hag tag';

function getStatusBadgeClass(status: string): string {
  const normalized = status === 'launching' || status === 'submitted' ? 'running' : status === 'stopped' ? 'warning' : status;
  return `status-badge ${normalized}`;
}

function hasVietnameseText(value: string): boolean {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(value);
}

export function ResultsPage() {
  const {
    runs,
    loading,
    selectedRunBundle,
    selectedRunId,
    copyMessage,
    writingBackJobIds,
    setSelectedRunId,
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
      <div className="results-filter-bar panel">
        <input type="search" placeholder="Search runs by name or ID..." aria-label="Search runs by name or ID" />
        <select aria-label="Filter by profile" defaultValue="all-profiles">
          <option value="all-profiles">All profiles</option>
          {runs.map(({ run }) => (
            <option key={run.id} value={run.profileSnapshot.name}>{run.profileSnapshot.name}</option>
          ))}
        </select>
        <select aria-label="Filter by status" defaultValue="all-status">
          <option value="all-status">All status</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
        <input type="text" aria-label="Date range" value="Oct 1, 2026 – Oct 6, 2026" readOnly />
        <button type="button" className="button secondary">Clear</button>
      </div>

      <div className="results-console-grid">
        <section className="panel card section-stack results-run-list-panel">
          <div className="section-toolbar">
            <h2 className="section-title">Runs ({runs.length})</h2>
            <select aria-label="Sort runs" defaultValue="newest" className="compact-select">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div className="results-run-list">
            {runs.map(({ run, jobResults }) => {
              const isActive = run.id === selectedRunId;
              return (
                <article key={run.id} className={`results-run-card ${isActive ? 'active' : ''}`}>
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
                    <button type="button" className="icon-button" onClick={() => deleteRun(run.id)} title="Delete run" aria-label="Delete run">×</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel card section-stack results-main-panel">
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
                    <span className={getStatusBadgeClass(selectedRunBundle.run.status)}>{selectedRunBundle.run.status}</span>
                  </div>
                  <p>Run ID: {selectedRunBundle.run.id}</p>
                </div>
                <div className="results-selected-run-actions">
                  <div className="results-selected-run-meta">
                    <span>{selectedRunBundle.run.jobs.length} scripts</span>
                    <span>{formatDate(selectedRunBundle.run.createdAt)}</span>
                  </div>
                  <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>Add row</button>
                </div>
              </header>

              {selectedRunBundle.run.jobs.length === 0 ? (
                <div className="empty-state results-script-empty">
                  <h3>No runtime scripts</h3>
                  <p>This Run does not contain any runtime scripts yet.</p>
                  <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>Add row</button>
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
                        <header className="results-script-card-header">
                          <div>
                            <div className="results-title-row">
                              <h3>Script {index + 1}</h3>
                              <span className={getStatusBadgeClass(job.status)}>{job.status}</span>
                            </div>
                            <p><strong>{job.scriptTitle || 'Untitled script'}</strong> · Input: {job.inputField ?? 'content'}</p>
                            <p>
                              Source row: {job.source?.sourceRowNumber ?? job.scriptNumberNo ?? '—'}
                              {job.source?.videoTitle ? ` · Video: ${job.source.videoTitle}` : ''}
                            </p>
                          </div>
                          <button type="button" className="button secondary" onClick={() => void deleteRuntimeJob(runId, job.scriptId)}>Delete row</button>
                        </header>

                        <div className="results-script-grid">
                          <section className="results-script-section">
                            <h4>Script identity</h4>
                            <label className="field">
                              <span>Profile name</span>
                              <input style={cellInputStyle} value={job.profileName} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { profileName: event.target.value })} />
                            </label>
                            <label className="field">
                              <span>Script title</span>
                              <input style={cellInputStyle} value={job.scriptTitle} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { scriptTitle: event.target.value })} />
                            </label>
                            {(job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl) ? (
                              <a href={job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl} target="_blank" rel="noreferrer">Open profile URL</a>
                            ) : <span className="results-script-help">No profile URL.</span>}
                          </section>

                          <section className="results-script-section">
                            <h4>Runtime</h4>
                            <label className="field">
                              <span>Status</span>
                              <select style={cellInputStyle} value={job.status} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { status: event.target.value as JobStatus })}>
                                <option value="pending">pending</option>
                                <option value="launching">launching</option>
                                <option value="submitted">submitted</option>
                                <option value="completed">completed</option>
                                <option value="failed">failed</option>
                                <option value="stopped">stopped</option>
                                <option value="skipped">skipped</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>Tab ID</span>
                              <input type="number" style={cellInputStyle} value={job.tabId ?? ''} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { tabId: event.target.value ? Number(event.target.value) : null })} />
                            </label>
                            <div className="results-script-help">Submitted: {formatDate(job.submittedAt)}</div>
                            {job.currentTabUrl ? <a href={job.currentTabUrl} target="_blank" rel="noreferrer">{job.currentTabUrl}</a> : <span className="results-script-help">{job.tabId ? 'Will sync from real running tab' : 'No live tab yet'}</span>}
                            <div className="results-script-actions">
                              <button type="button" className="button secondary" onClick={() => void relinkTabFromUrl(runId, job.scriptId)} disabled={!(job.currentTabUrl || job.url)}>Open &amp; relink</button>
                            </div>
                            {canSubmitTextToUrl ? (
                              <>
                                <label className="field">
                                  <span>Manual submit text</span>
                                  <textarea style={cellTextareaStyle} rows={3} value={manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT} onChange={(event) => setManualSubmitTextByJob((current) => ({ ...current, [jobKey]: event.target.value }))} placeholder="Manual text to submit into this current URL" />
                                </label>
                                <button type="button" className="button secondary" disabled={!(job.currentTabUrl || job.url) || !(manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT).trim()} onClick={() => void submitManualTextToJob(runId, job.scriptId, manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT)}>Submit text to URL</button>
                              </>
                            ) : null}
                          </section>

                          <section className="results-script-section results-script-section-wide">
                            <h4>Output</h4>
                            <label className="field">
                              <span>Collection mode</span>
                              <select style={cellInputStyle} value={collectMode} onChange={(event) => setCollectModeByJob((current) => ({ ...current, [jobKey]: event.target.value as CollectOutputMode }))}>
                                <option value="japanese-scripts">Japanese scripts only</option>
                                <option value="full-response">Full response</option>
                              </select>
                            </label>
                            <div className="results-script-actions">
                              <button type="button" className="button secondary" onClick={() => void collectScripts(runId, job.scriptId, collectMode)} disabled={!collectEnabled}>Lấy scripts</button>
                              <span className="results-script-help">{collectEnabled ? 'Ready to collect from running tab.' : 'Enabled after tab is submitted and tab ID exists.'}</span>
                            </div>
                            <label className="field">
                              <span>Output</span>
                              <textarea style={cellTextareaStyle} value={job.output} rows={7} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { output: event.target.value })} />
                            </label>
                            <div className="badge" style={{ width: 'fit-content' }}>{job.output.length} chars</div>
                            {collectMode === 'japanese-scripts' && hasVietnameseText(job.output) ? <div style={{ color: '#fbbf24', fontSize: 11 }}>Phát hiện tiếng Việt trong output Japanese scripts only.</div> : null}
                            <div className="results-script-actions">
                              <button type="button" className="button secondary" onClick={() => setOutputModal({ runId, scriptId: job.scriptId, title: `${job.scriptId} · ${job.scriptTitle}`, content: job.output || '' })}>View output</button>
                              <button type="button" className="button secondary" onClick={() => void copyText(job.output, `Copied output for ${job.scriptId}.`)} disabled={!job.output}>Copy output</button>
                              <button type="button" className="button secondary" onClick={() => void writeBackRuntimeJob(runId, job.scriptId)} disabled={Boolean(writeBackDisabledReason) || isWritingBack} title={isWritingBack ? 'Writing output to Google Sheet...' : (writeBackDisabledReason ?? 'Write output back to Google Sheet')}>{isWritingBack ? 'Writing to Sheet...' : 'Write back to Sheet'}</button>
                            </div>
                            <div className="results-script-help" style={{ color: writeBackDisabledReason ? '#fca5a5' : undefined }}>{isWritingBack ? 'Processing: resolving row and writing output...' : (writeBackDisabledReason ?? `Sheet: ${job.sheetWriteback.status}${job.sheetWriteback.targetRowNumber ? ` · row ${job.sheetWriteback.targetRowNumber}` : ''}${job.sheetWriteback.targetColumn ? ` · col ${job.sheetWriteback.targetColumn}` : ''}`)}</div>
                            {job.sheetWriteback.message ? <div className="results-script-help" style={{ color: job.sheetWriteback.status === 'written' ? '#86efac' : '#fca5a5' }}>{job.sheetWriteback.message}</div> : null}
                          </section>

                          <section className="results-script-section results-script-section-wide">
                            <h4>Error</h4>
                            <label className="field">
                              <span>Error message</span>
                              <textarea style={cellTextareaStyle} value={job.errorMessage ?? ''} rows={3} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { errorMessage: event.target.value || null })} />
                            </label>
                          </section>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {copyMessage ? (
        <div role="status" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1100, maxWidth: 420, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(96, 165, 250, 0.38)', background: 'rgba(15, 23, 42, 0.96)', color: '#dbeafe', boxShadow: '0 18px 45px rgba(2, 6, 23, 0.42)', fontSize: 13 }}>
          {copyMessage}
        </div>
      ) : null}

      {outputModal ? (
        <div role="dialog" aria-modal="true" onClick={() => setOutputModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.72)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 1000 }}>
          <div className="panel card" onClick={(event) => event.stopPropagation()} style={{ width: 'min(960px, 100%)', maxHeight: '85vh', display: 'grid', gap: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <h3 className="section-title" style={{ marginBottom: 6 }}>Full output</h3>
                <p className="section-subtitle">{outputModal.title}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="button" onClick={() => { void updateRuntimeJob(outputModal.runId, outputModal.scriptId, { output: outputModal.content }); setOutputModal(null); }}>Save output</button>
                <button type="button" className="button secondary" onClick={() => setOutputModal(null)}>Close</button>
              </div>
            </div>
            <textarea aria-label="Full output" value={outputModal.content} onChange={(event) => setOutputModal((current) => current ? { ...current, content: event.target.value } : current)} style={{ ...cellTextareaStyle, minHeight: 420, maxHeight: '65vh', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace', whiteSpace: 'pre-wrap', overflow: 'auto' }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
