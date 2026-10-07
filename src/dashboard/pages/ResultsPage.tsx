import { useMemo, useState } from 'react';
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

function trimText(value: string, max = 180): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
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
    selectedJobResult,
    selectedJobResultId,
    selectedStageResults,
    copyMessage,
    writingBackJobIds,
    setSelectedRunId,
    setSelectedJobResultId,
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

  const groupedRuntimeJobCards = useMemo(() => {
    if (!selectedRunBundle) {
      return [];
    }

    const relatedRuns = runs
      .filter((bundle) => bundle.run.batchId === selectedRunBundle.run.batchId)
      .map((bundle) => bundle.run);
    type RuntimeChild = { runId: string; job: (typeof selectedRunBundle.run.jobs)[number] };
    const groups = new Map<string, { key: string; numberNo: string | null; scriptTitle: string; children: RuntimeChild[] }>();

    for (const run of relatedRuns) {
      for (const job of run.jobs) {
        const key = job.source?.sourceRowNumber ? `row-${job.source.sourceRowNumber}` : `${job.scriptId || job.scriptTitle}`;
        const current = groups.get(key) ?? {
          key,
          numberNo: job.scriptNumberNo || null,
          scriptTitle: job.scriptTitle,
          children: [],
        };
        const existingChildIndex = current.children.findIndex((child) => child.runId === run.id && child.job.scriptId === job.scriptId);
        if (existingChildIndex >= 0) {
          current.children[existingChildIndex] = { runId: run.id, job };
        } else {
          current.children.push({ runId: run.id, job });
        }
        current.scriptTitle = current.scriptTitle || job.scriptTitle;
        current.numberNo = current.numberNo || job.scriptNumberNo || null;
        groups.set(key, current);
      }
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      children: group.children.sort((left, right) => {
        const leftField = left.job.inputField ?? 'content';
        const rightField = right.job.inputField ?? 'content';
        if (leftField !== rightField) {
          return leftField === 'content' ? -1 : 1;
        }
        return left.job.order - right.job.order;
      }),
    }));
  }, [runs, selectedRunBundle]);

  const runSummary = useMemo(() => {
    if (!selectedRunBundle) {
      return null;
    }

    const { run, jobResults } = selectedRunBundle;
    return {
      totalJobs: run.jobs.length,
      completedJobs: jobResults.filter((job) => job.status === 'completed').length,
      failedJobs: jobResults.filter((job) => job.status === 'failed').length,
      skippedJobs: jobResults.filter((job) => job.status === 'skipped').length,
    };
  }, [selectedRunBundle]);

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
      <div className="master-detail-grid master-detail-grid--results">
        <section className="panel card section-stack">
          <div>
            <h2 className="section-title">Runs</h2>
            <p className="section-subtitle">Select a run to inspect saved job results and runtime launch records.</p>
          </div>
          <div style={{ display: 'grid', gap: 10, maxHeight: '70vh', overflowY: 'auto' }}>
            {runs.map(({ run, jobResults }) => {
              const isActive = run.id === selectedRunId;
              return (
                <div key={run.id} className="panel" style={{ borderRadius: 16, padding: 12, display: 'grid', gap: 8 }}>
                  <button
                    type="button"
                    className={`button secondary ${isActive ? 'is-selected' : ''}`}
                    onClick={() => setSelectedRunId(run.id)}
                    style={{ textAlign: 'left', display: 'grid', gap: 6, padding: 14 }}
                  >
                    <strong>{run.profileSnapshot.name}</strong>
                      <span style={{ fontSize: 12, color: '#bfd2f5' }}>Run ID: {run.id}</span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={getStatusBadgeClass(run.status)}>{run.status}</span>
                      <span style={{ fontSize: 12, color: '#9fb1cd' }}>Jobs saved: {jobResults.length}/{run.jobs.length}</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#9fb1cd' }}>Started: {formatDate(run.createdAt)}</span>
                  </button>
                  <button type="button" className="button secondary" onClick={() => deleteRun(run.id)}>
                    Delete run
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel card section-stack">
          <div>
            <h2 className="section-title">Job Results</h2>
            <p className="section-subtitle">Final outputs for each script in the selected run.</p>
          </div>

          {selectedRunBundle && runSummary ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Run status</div>
                  <span className={getStatusBadgeClass(selectedRunBundle.run.status)}>{selectedRunBundle.run.status}</span>
                </div>
                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Jobs</div>
                  <strong>{runSummary.completedJobs}/{runSummary.totalJobs} completed</strong>
                </div>
                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Failed</div>
                  <strong>{runSummary.failedJobs}</strong>
                </div>
                <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#9fb1cd' }}>Skipped</div>
                  <strong>{runSummary.skippedJobs}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10, maxHeight: '52vh', overflowY: 'auto' }}>
                {selectedRunBundle.jobResults.map((jobResult) => {
                  const isActive = jobResult.id === selectedJobResultId;
                  return (
                    <button
                      key={jobResult.id}
                      type="button"
                      className={`button secondary ${isActive ? 'is-selected' : ''}`}
                      onClick={() => setSelectedJobResultId(jobResult.id)}
                      style={{ textAlign: 'left', display: 'grid', gap: 6, padding: 14 }}
                    >
                      <strong>{jobResult.scriptId}</strong>
                      <span className={getStatusBadgeClass(jobResult.status)} style={{ width: 'fit-content' }}>{jobResult.status}</span>
                      <span style={{ fontSize: 12, color: '#9fb1cd' }}>
                        Final output: {jobResult.finalOutput ? trimText(jobResult.finalOutput, 90) : 'No output yet'}
                      </span>
                      <span style={{ fontSize: 12, color: '#9fb1cd' }}>Finished: {formatDate(jobResult.endedAt)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </section>

        <section className="panel card section-stack">
          <div>
            <h2 className="section-title">Result Detail</h2>
            <p className="section-subtitle">View final output and each stage response for the selected script.</p>
          </div>

          {copyMessage ? (
            <div className="badge" style={{ width: 'fit-content' }}>{copyMessage}</div>
          ) : null}

          {!selectedJobResult ? (
            <div className="panel" style={{ borderRadius: 16, padding: 16 }}>
              No job result selected.
            </div>
          ) : (
            <>
              <div className="panel" style={{ borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Script</div>
                    <strong>{selectedJobResult.scriptId}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => copyText(selectedJobResult.finalOutput, `Copied final output for ${selectedJobResult.scriptId}.`)}
                      disabled={!selectedJobResult.finalOutput}
                    >
                      Copy output
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Status</div>
                    <span className={getStatusBadgeClass(selectedJobResult.status)}>{selectedJobResult.status}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Started</div>
                    <strong>{formatDate(selectedJobResult.startedAt)}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#9fb1cd' }}>Finished</div>
                    <strong>{formatDate(selectedJobResult.endedAt)}</strong>
                  </div>
                </div>
                {selectedJobResult.errorMessage ? (
                  <div style={{ color: '#fca5a5', fontSize: 13 }}>Error: {selectedJobResult.errorMessage}</div>
                ) : null}
                <div className="field">
                  <label>Final output</label>
                  <textarea readOnly value={selectedJobResult.finalOutput} rows={8} />
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {selectedStageResults.map((stageResult, index) => (
                  <article key={stageResult.id} className="panel" style={{ borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#9fb1cd' }}>Stage {index + 1}</div>
                        <strong>{stageResult.stageName}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={getStatusBadgeClass(stageResult.status)}>{stageResult.status}</span>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => copyText(stageResult.response, `Copied stage ${stageResult.stageName} response.`)}
                          disabled={!stageResult.response}
                        >
                          Copy stage output
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#9fb1cd' }}>Started</div>
                        <strong>{formatDate(stageResult.startedAt)}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#9fb1cd' }}>Finished</div>
                        <strong>{formatDate(stageResult.endedAt)}</strong>
                      </div>
                    </div>

                    <div className="field">
                      <label>Stage input</label>
                      <textarea readOnly value={stageResult.input} rows={4} />
                    </div>
                    <div className="field">
                      <label>Stage response</label>
                      <textarea readOnly value={stageResult.response} rows={8} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="panel card" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 className="section-title">Launch runtime table</h2>
            <p className="section-subtitle">Manage runtime records here. Current tab URL is the real conversation URL, and output is only collected when you click the button.</p>
          </div>
          {selectedRunBundle ? (
            <button type="button" className="button secondary" onClick={() => addRuntimeJob(selectedRunBundle.run.id)}>
              Add row
            </button>
          ) : null}
        </div>

        {!selectedRunBundle ? (
          <div className="panel" style={{ borderRadius: 16, padding: 16 }}>
            No run selected.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: 1280 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>RowNumber</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Profile</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Script</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Status</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Tab ID</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Current Tab URL</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Submitted</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Output</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Error</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedRuntimeJobCards.map((group) => (
                  <tr key={group.key}>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <div className="panel" style={{ borderRadius: 16, padding: 12, display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div>
                            <strong>{group.scriptTitle}</strong>
                            <div style={{ color: '#9fb1cd', fontSize: 12 }}>RowNumber: {group.numberNo ?? 'null'}</div>
                          </div>
                          <span className="badge">{group.children.length} profile run(s)</span>
                        </div>
                        {group.children.map(({ runId, job }) => {
                          const collectEnabled = canCollectScripts(job);
                          const writeBackDisabledReason = getWriteBackDisabledReason(job);
                          const isWritingBack = writingBackJobIds.includes(`${runId}:${job.scriptId}`);
                          const canSubmitTextToUrl = job.profileName.trim().toUpperCase().startsWith('BTV');
                          return (
                            <div
                              key={`${runId}:${job.scriptId}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '0.7fr 1.1fr 1.4fr 0.9fr 0.8fr 1.5fr 0.8fr 1.2fr 1fr 0.9fr',
                                gap: 12,
                                alignItems: 'start',
                                borderTop: '1px solid rgba(148, 163, 184, 0.12)',
                                paddingTop: 12,
                              }}
                            >
                              <div style={{ color: '#bfd0ea', fontSize: 13, paddingTop: 10 }}>{job.inputField ?? 'content'}</div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                <input style={cellInputStyle} value={job.profileName} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { profileName: event.target.value })} />
                                {(job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl) ? (
                                  <a href={job.url ?? selectedRunBundle.run.profileSnapshot.baseUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all', fontSize: 12 }}>Open profile URL</a>
                                ) : null}
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                <input style={cellInputStyle} value={job.scriptTitle} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { scriptTitle: event.target.value })} />
                                <div style={{ color: '#9fb1cd', fontSize: 12 }}>Run ID: {runId}</div>
                                {job.source?.videoTitle ? <div style={{ color: '#bfdbfe', fontSize: 12 }}>Video title: {job.source.videoTitle}</div> : null}
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                <span className={getStatusBadgeClass(job.status)} style={{ width: 'fit-content' }}>{job.status}</span>
                                <select style={cellInputStyle} value={job.status} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { status: event.target.value as JobStatus })}>
                                  <option value="pending">pending</option>
                                  <option value="launching">launching</option>
                                  <option value="submitted">submitted</option>
                                  <option value="completed">completed</option>
                                  <option value="failed">failed</option>
                                  <option value="stopped">stopped</option>
                                  <option value="skipped">skipped</option>
                                </select>
                              </div>
                              <div>
                                <input style={cellInputStyle} value={job.tabId ?? ''} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { tabId: event.target.value ? Number(event.target.value) : null })} />
                              </div>
                              <div style={{ paddingTop: 10, display: 'grid', gap: 8 }}>
                                {job.currentTabUrl ? (
                                  <a href={job.currentTabUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all', fontSize: 13 }}>{job.currentTabUrl}</a>
                                ) : (
                                  <span style={{ color: '#9fb1cd', fontSize: 12 }}>{job.tabId ? 'Will sync from real running tab' : 'No live tab yet'}</span>
                                )}
                                {canSubmitTextToUrl ? (
                                  <>
                                    <textarea style={cellTextareaStyle} rows={3} value={manualSubmitTextByJob[`${runId}:${job.scriptId}`] ?? DEFAULT_MANUAL_SUBMIT_TEXT} onChange={(event) => setManualSubmitTextByJob((current) => ({ ...current, [`${runId}:${job.scriptId}`]: event.target.value }))} placeholder="Manual text to submit into this current URL" />
                                    <button type="button" className="button secondary" disabled={!(job.currentTabUrl || job.url) || !(manualSubmitTextByJob[`${runId}:${job.scriptId}`] ?? DEFAULT_MANUAL_SUBMIT_TEXT).trim()} onClick={() => void submitManualTextToJob(runId, job.scriptId, manualSubmitTextByJob[`${runId}:${job.scriptId}`] ?? DEFAULT_MANUAL_SUBMIT_TEXT)}>Submit text to URL</button>
                                  </>
                                ) : null}
                              </div>
                              <div style={{ color: '#bfd0ea', fontSize: 12, paddingTop: 10 }}>{formatDate(job.submittedAt)}</div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                <textarea style={cellTextareaStyle} value={job.output} rows={5} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { output: event.target.value })} />
                                <div className="badge" style={{ width: 'fit-content' }}>{job.output.length} chars</div>
                                {(collectModeByJob[`${runId}:${job.scriptId}`] ?? 'japanese-scripts') === 'japanese-scripts' && hasVietnameseText(job.output) ? (
                                  <div style={{ color: '#fbbf24', fontSize: 11 }}>Phát hiện tiếng Việt trong output Japanese scripts only.</div>
                                ) : null}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button type="button" className="button secondary" onClick={() => setOutputModal({ runId, scriptId: job.scriptId, title: `${job.scriptId} · ${job.scriptTitle}`, content: job.output || '' })}>View output</button>
                                  <button type="button" className="button secondary" onClick={() => void copyText(job.output, `Copied output for ${job.scriptId}.`)} disabled={!job.output}>Copy output</button>
                                </div>
                              </div>
                              <div>
                                <textarea style={cellTextareaStyle} value={job.errorMessage ?? ''} rows={3} onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { errorMessage: event.target.value || null })} />
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                <select style={cellInputStyle} value={collectModeByJob[`${runId}:${job.scriptId}`] ?? 'japanese-scripts'} onChange={(event) => setCollectModeByJob((current) => ({ ...current, [`${runId}:${job.scriptId}`]: event.target.value as CollectOutputMode }))}>
                                  <option value="japanese-scripts">Japanese scripts only</option>
                                  <option value="full-response">Full response</option>
                                </select>
                                <button type="button" className="button secondary" onClick={() => void collectScripts(runId, job.scriptId, collectModeByJob[`${runId}:${job.scriptId}`] ?? 'japanese-scripts')} disabled={!collectEnabled}>Lấy scripts</button>
                                <div style={{ color: '#9fb1cd', fontSize: 11 }}>{collectEnabled ? 'Ready to collect from running tab.' : 'Enabled after tab is submitted and tab ID exists.'}</div>
                                <button type="button" className="button secondary" onClick={() => void writeBackRuntimeJob(runId, job.scriptId)} disabled={Boolean(writeBackDisabledReason) || isWritingBack} title={isWritingBack ? 'Writing output to Google Sheet...' : (writeBackDisabledReason ?? 'Write output back to Google Sheet')}>{isWritingBack ? 'Writing to Sheet...' : 'Write back to Sheet'}</button>
                                <div style={{ color: writeBackDisabledReason ? '#fca5a5' : '#9fb1cd', fontSize: 11 }}>{isWritingBack ? 'Processing: resolving row and writing output...' : (writeBackDisabledReason ?? `Sheet: ${job.sheetWriteback.status}${job.sheetWriteback.targetRowNumber ? ` · row ${job.sheetWriteback.targetRowNumber}` : ''}${job.sheetWriteback.targetColumn ? ` · col ${job.sheetWriteback.targetColumn}` : ''}`)}</div>
                                {job.sheetWriteback.message ? <div style={{ color: job.sheetWriteback.status === 'written' ? '#86efac' : '#fca5a5', fontSize: 11 }}>{job.sheetWriteback.message}</div> : null}
                                <button type="button" className="button secondary" onClick={() => void relinkTabFromUrl(runId, job.scriptId)} disabled={!(job.currentTabUrl || job.url)}>Open & relink</button>
                                <button type="button" className="button secondary" onClick={() => void deleteRuntimeJob(runId, job.scriptId)}>Delete row</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {copyMessage ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: 1100,
            maxWidth: 420,
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid rgba(96, 165, 250, 0.38)',
            background: 'rgba(15, 23, 42, 0.96)',
            color: '#dbeafe',
            boxShadow: '0 18px 45px rgba(2, 6, 23, 0.42)',
            fontSize: 13,
          }}
        >
          {copyMessage}
        </div>
      ) : null}

      {outputModal ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOutputModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 1000,
          }}
        >
          <div
            className="panel card"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(960px, 100%)',
              maxHeight: '85vh',
              display: 'grid',
              gap: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <h3 className="section-title" style={{ marginBottom: 6 }}>Full output</h3>
                <p className="section-subtitle">{outputModal.title}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    void updateRuntimeJob(outputModal.runId, outputModal.scriptId, { output: outputModal.content });
                    setOutputModal(null);
                  }}
                >
                  Save output
                </button>
                <button type="button" className="button secondary" onClick={() => setOutputModal(null)}>
                  Close
                </button>
              </div>
            </div>
            <textarea
              value={outputModal.content}
              onChange={(event) => setOutputModal((current) => current ? { ...current, content: event.target.value } : current)}
              style={{
                ...cellTextareaStyle,
                minHeight: 420,
                maxHeight: '65vh',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
