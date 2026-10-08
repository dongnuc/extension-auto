import { useMemo, useState } from 'react';
import type { CollectOutputMode } from '../../shared/messaging/contracts';
import { useResults } from '../hooks/useResults';

const DEFAULT_MANUAL_SUBMIT_TEXT = 'từ tiêu đề này hãy viết mô tả (220 ký tự trong đó phải đảm bảo phải viết được keywords chính) tag + hag tag';

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getStatusBadgeClass(status: string): string {
  const normalized = status === 'launching' || status === 'submitted' ? 'running' : status === 'stopped' ? 'warning' : status;
  return `status-badge ${normalized}`;
}

function hasVietnameseText(value: string): boolean {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(value);
}

function getWriteBackDisabledReason(job: { output: string; scriptTitle: string }): string | null {
  if (!job.output.trim()) {
    return 'Output is empty. Collect or enter output first.';
  }
  if (!job.scriptTitle.trim()) {
    return 'Video title is empty, so this row cannot be written back.';
  }
  return null;
}

export function ResultsPage() {
  const {
    runs,
    loading,
    selectedRunId,
    deleteMessage,
    writingBackJobIds,
    setSelectedRunId,
    updateRuntimeJob,
    deleteRuntimeJob,
    deleteRun,
    collectScripts,
    relinkTabFromUrl,
    submitManualTextToJob,
    writeBackRuntimeJob,
    canCollectScripts,
  } = useResults();

  const [manualSubmitTextByJob, setManualSubmitTextByJob] = useState<Record<string, string>>({});
  const [collectModeByJob, setCollectModeByJob] = useState<Record<string, CollectOutputMode>>({});
  const [outputModal, setOutputModal] = useState<{ runId: string; scriptId: string; scriptRef: string; content: string } | null>(null);

  const batchGroups = useMemo(() => {
    const groups = new Map<string, { batchId: string; batchName: string; bundles: typeof runs }>();
    runs.forEach((bundle) => {
      const existing = groups.get(bundle.run.batchId);
      if (existing) {
        existing.bundles.push(bundle);
      } else {
        groups.set(bundle.run.batchId, { batchId: bundle.run.batchId, batchName: bundle.batchName, bundles: [bundle] });
      }
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      bundles: group.bundles.sort((left, right) => new Date(right.run.createdAt).getTime() - new Date(left.run.createdAt).getTime()),
    }));
  }, [runs]);

  const selectedBatchGroup = useMemo(
    () => batchGroups.find((group) => group.bundles.some((bundle) => bundle.run.id === selectedRunId)) ?? batchGroups[0] ?? null,
    [batchGroups, selectedRunId],
  );

  const groupedJobs = useMemo(() => {
    if (!selectedBatchGroup) {
      return [];
    }
    return selectedBatchGroup.bundles
      .flatMap((bundle) => bundle.run.jobs.map((job) => ({ run: bundle.run, job })))
      .sort((left, right) => {
        const leftRef = left.job.scriptNumberNo?.trim() || String(left.job.source?.sourceRowNumber ?? '');
        const rightRef = right.job.scriptNumberNo?.trim() || String(right.job.source?.sourceRowNumber ?? '');
        const refOrder = leftRef.localeCompare(rightRef, undefined, { numeric: true });
        if (refOrder !== 0) return refOrder;
        if (left.job.inputField !== right.job.inputField) return left.job.inputField === 'content' ? -1 : 1;
        return new Date(right.run.createdAt).getTime() - new Date(left.run.createdAt).getTime();
      });
  }, [selectedBatchGroup]);

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading results...</h2>
      </section>
    );
  }

  if (runs.length === 0) {
    return (
      <section className="panel card results-empty-page">
        <h2 className="section-title">Results</h2>
        <p className="section-subtitle">No run data yet. Run a flow to populate this view.</p>
      </section>
    );
  }

  return (
    <div className="results-page-shell">
      {deleteMessage ? (
        <div className={`results-delete-message ${deleteMessage.type}`} role={deleteMessage.type === 'error' ? 'alert' : 'status'}>
          {deleteMessage.text}
        </div>
      ) : null}
      <div className="results-workspace-grid">
      <section className="panel card section-stack results-run-list-panel">
        <h2 className="section-title">Runs <span className="results-count">({runs.length})</span></h2>
        <div className="results-run-list">
          {batchGroups.map((group) => {
            const isActive = group.batchId === selectedBatchGroup?.batchId;
            const latestRun = group.bundles[0].run;
            const totalJobs = group.bundles.reduce((total, bundle) => total + bundle.run.jobs.length, 0);
            const completedJobs = group.bundles.reduce((total, bundle) => total + bundle.run.jobs.filter((job) => job.status === 'completed').length, 0);
            const groupStatus = group.bundles.some((bundle) => bundle.run.status === 'running')
              ? 'running'
              : group.bundles.some((bundle) => bundle.run.status === 'failed')
                ? 'failed'
                : group.bundles.every((bundle) => bundle.run.status === 'completed') ? 'completed' : latestRun.status;
            return (
              <article key={group.batchId} className={`results-run-card ${isActive ? 'active' : ''}`}>
                <button type="button" onClick={() => setSelectedRunId(latestRun.id)} aria-pressed={isActive}>
                  <span className="results-run-card-title">{group.batchName}</span>
                  <span className="results-run-card-id">{group.bundles.length} run{group.bundles.length === 1 ? '' : 's'} · content/title</span>
                  <span className="results-run-card-meta">
                    <span>{completedJobs}/{totalJobs} jobs</span>
                    <span>{formatDate(latestRun.createdAt)}</span>
                  </span>
                </button>
                <div className="results-run-card-side">
                  <span className={getStatusBadgeClass(groupStatus)}>{groupStatus}</span>
                  <button type="button" className="icon-button" onClick={() => group.bundles.forEach((bundle) => deleteRun(bundle.run.id))} title="Delete batch runs" aria-label={`Delete all runs for ${group.batchName}`}>
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel card section-stack results-table-panel">
        {!selectedBatchGroup ? (
          <div className="empty-state results-script-empty">
            <h3>No run selected</h3>
            <p>Select a run to view its scripts.</p>
          </div>
        ) : (
          <>
            <header className="results-table-header">
              <div>
                <h2 className="section-title">{selectedBatchGroup.batchName}</h2>
                <p className="section-subtitle">{selectedBatchGroup.bundles.length} runs · {groupedJobs.length} jobs · Content above Title</p>
              </div>
              <span className={getStatusBadgeClass(selectedBatchGroup.bundles[0].run.status)}>{selectedBatchGroup.bundles[0].run.status}</span>
            </header>

            <div className="results-table-wrap">
              <table className="results-jobs-table">
                <thead>
                  <tr>
                    <th className="results-col-index">STT</th>
                    <th className="results-col-source">Script Ref</th>
                    <th className="results-col-manual">Manual submit text</th>
                    <th className="results-col-output">Output</th>
                    <th className="results-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="results-table-empty">This run does not contain any runtime scripts.</td>
                    </tr>
                  ) : groupedJobs.map(({ run, job }, index) => {
                    const runId = run.id;
                    const jobKey = `${runId}:${job.scriptId}`;
                    const scriptRef = job.scriptNumberNo?.trim() || (job.source?.sourceRowNumber ? String(job.source.sourceRowNumber) : '—');
                    const manualText = manualSubmitTextByJob[jobKey] ?? DEFAULT_MANUAL_SUBMIT_TEXT;
                    const collectMode = collectModeByJob[jobKey] ?? 'japanese-scripts';
                    const collectEnabled = canCollectScripts(job);
                    const writeBackDisabledReason = getWriteBackDisabledReason(job);
                    const isWritingBack = writingBackJobIds.includes(jobKey);
                    const canSubmitManually = job.profileName.trim().toUpperCase().startsWith('BTV');
                    const hasTargetUrl = Boolean(job.currentTabUrl || job.url);

                    return (
                      <tr key={jobKey}>
                        <td className="results-cell-index">{index + 1}</td>
                        <td className="results-cell-source">
                          <strong>{scriptRef}</strong>
                          <span className={`results-input-field-badge ${job.inputField}`}>{job.inputField === 'content' ? 'Content' : 'Title'}</span>
                          <span className={getStatusBadgeClass(job.status)}>{job.status}</span>
                        </td>
                        <td>
                          <div className="results-table-cell-stack">
                            <textarea
                              className="results-table-textarea results-manual-textarea"
                              aria-label={`Manual submit text for script ${scriptRef}`}
                              rows={5}
                              value={manualText}
                              onChange={(event) => setManualSubmitTextByJob((current) => ({ ...current, [jobKey]: event.target.value }))}
                            />
                            <button
                              type="button"
                              className="button secondary results-cell-button"
                              disabled={!canSubmitManually || !hasTargetUrl || !manualText.trim()}
                              onClick={() => void submitManualTextToJob(runId, job.scriptId, manualText)}
                            >
                              Submit
                            </button>
                            {!canSubmitManually ? <span className="results-cell-help warning">Manual submit is available for BTV profiles only.</span> : !hasTargetUrl ? <span className="results-cell-help warning">No current URL is available.</span> : null}
                          </div>
                        </td>
                        <td>
                          <div className="results-table-cell-stack">
                            <textarea
                              className="results-table-textarea results-output-textarea"
                              aria-label={`Output for script ${scriptRef}`}
                              rows={7}
                              value={job.output}
                              onChange={(event) => void updateRuntimeJob(runId, job.scriptId, { output: event.target.value })}
                            />
                            <div className="results-output-meta">
                              <span className="results-cell-help">{job.output.length.toLocaleString()} characters</span>
                              <button
                                type="button"
                                className="button secondary results-view-output-button"
                                disabled={!job.output}
                                onClick={() => setOutputModal({ runId, scriptId: job.scriptId, scriptRef, content: job.output })}
                              >
                                View output
                              </button>
                            </div>
                            {collectMode === 'japanese-scripts' && hasVietnameseText(job.output) ? <span className="results-cell-help warning">Vietnamese text detected in Scripts only output.</span> : null}
                          </div>
                        </td>
                        <td>
                          <div className="results-table-cell-stack results-action-cell">
                            <button
                              type="button"
                              className="button secondary"
                              disabled={!hasTargetUrl}
                              onClick={() => void relinkTabFromUrl(runId, job.scriptId)}
                              title={hasTargetUrl ? 'Open the saved URL and relink this job to its tab' : 'No saved URL is available'}
                            >
                              Open link
                            </button>
                            <label>
                              <span>Collection mode</span>
                              <select value={collectMode} onChange={(event) => setCollectModeByJob((current) => ({ ...current, [jobKey]: event.target.value as CollectOutputMode }))}>
                                <option value="japanese-scripts">Scripts only</option>
                                <option value="full-response">Full response</option>
                              </select>
                            </label>
                            <div className="results-compact-actions">
                              <button type="button" className="button secondary" onClick={() => void collectScripts(runId, job.scriptId, collectMode)} disabled={!collectEnabled}>Lấy scripts</button>
                              <button
                                type="button"
                                className="button secondary"
                                onClick={() => void writeBackRuntimeJob(runId, job.scriptId)}
                                disabled={Boolean(writeBackDisabledReason) || isWritingBack}
                                title={writeBackDisabledReason ?? 'Write output back to Google Sheet'}
                              >
                                {isWritingBack ? 'Writing...' : 'Write Sheet'}
                              </button>
                            </div>
                            <span className="results-cell-help">{collectEnabled ? 'Ready to collect from Gemini tab.' : 'Available after a submitted tab is linked.'}</span>
                            <span className={`results-cell-help ${writeBackDisabledReason ? 'error' : ''}`}>
                              {isWritingBack ? 'Writing output to Google Sheet...' : (writeBackDisabledReason ?? `Sheet: ${job.sheetWriteback.status}${job.sheetWriteback.targetRowNumber ? ` · row ${job.sheetWriteback.targetRowNumber}` : ''}${job.sheetWriteback.targetColumn ? ` · col ${job.sheetWriteback.targetColumn}` : ''}`)}
                            </span>
                            {job.sheetWriteback.message ? <span className={`results-cell-help ${job.sheetWriteback.status === 'written' ? 'success' : 'error'}`}>{job.sheetWriteback.message}</span> : null}
                            <button
                              type="button"
                              className="button results-delete-row-button"
                              onClick={() => void deleteRuntimeJob(runId, job.scriptId)}
                            >
                              Delete row
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {outputModal ? (
        <div className="results-output-modal-backdrop" role="presentation" onClick={() => setOutputModal(null)}>
          <section className="panel card results-output-modal" role="dialog" aria-modal="true" aria-labelledby="results-output-modal-title" onClick={(event) => event.stopPropagation()}>
            <header className="results-output-modal-header">
              <div>
                <h2 id="results-output-modal-title" className="section-title">Output · {outputModal.scriptRef}</h2>
                <p className="section-subtitle">Review and edit the full collected output.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setOutputModal(null)} aria-label="Close output dialog">×</button>
            </header>
            <textarea
              className="results-output-modal-textarea"
              aria-label={`Full output for script ${outputModal.scriptRef}`}
              value={outputModal.content}
              onChange={(event) => setOutputModal((current) => current ? { ...current, content: event.target.value } : current)}
            />
            <footer className="results-output-modal-actions">
              <span className="results-cell-help">{outputModal.content.length.toLocaleString()} characters</span>
              <div className="results-compact-actions">
                <button type="button" className="button secondary" onClick={() => setOutputModal(null)}>Cancel</button>
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
              </div>
            </footer>
          </section>
        </div>
      ) : null}
      </div>
    </div>
  );
}
