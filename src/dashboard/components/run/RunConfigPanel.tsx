import { useState } from 'react';
import type { GemProfile, Run, RunInputField, Script, ScriptBatch } from '../../../core/models';

interface RunConfigPanelProps {
  profiles: GemProfile[];
  batches: ScriptBatch[];
  batch: ScriptBatch | null;
  selectedBatchId: string;
  selectedProfileId: string;
  selectedInputField: RunInputField;
  selectedScriptIds: string[];
  activeRun: Run | null;
  errors: string[];
  submitMessage: string;
  onSelectBatch: (batchId: string) => void;
  onSelectProfile: (profileId: string) => void;
  onSelectInputField: (field: RunInputField) => void;
  onToggleScript: (scriptId: string) => void;
  onSelectAllScripts: () => void;
  onClearAllScripts: () => void;
  onStartRun: () => void;
  onPauseRun: () => void;
  onResumeRun: () => void;
  onStopRun: () => void;
  onRetryCurrentStage: () => void;
  onRetryCurrentJob: () => void;
  onSkipCurrentScript: () => void;
  onResetRunState: () => void;
  onClearActiveRun: () => void;
}

function getProgressPercent(activeRun: Run): number {
  if (activeRun.progress.totalJobs === 0) {
    return 0;
  }

  return Math.round((activeRun.progress.submittedJobs / activeRun.progress.totalJobs) * 100);
}

export function RunConfigPanel({
  profiles,
  batches,
  batch,
  selectedBatchId,
  selectedProfileId,
  selectedInputField,
  selectedScriptIds,
  activeRun,
  errors,
  submitMessage,
  onSelectBatch,
  onSelectProfile,
  onSelectInputField,
  onToggleScript,
  onSelectAllScripts,
  onClearAllScripts,
  onStartRun,
  onPauseRun,
  onResumeRun,
  onStopRun,
  onRetryCurrentJob,
  onResetRunState,
  onClearActiveRun,
}: RunConfigPanelProps) {
  const canPause = activeRun?.status === 'running' || activeRun?.status === 'queued';
  const canResume = activeRun?.status === 'paused';
  const canStop = activeRun ? ['queued', 'running', 'paused'].includes(activeRun.status) : false;
  const canRetryJob = activeRun ? ['failed', 'completed', 'stopped'].includes(activeRun.status) : false;
  const canReset = Boolean(activeRun);
  const canClear = activeRun ? !['queued', 'running', 'paused'].includes(activeRun.status) : true;
  const progressPercent = activeRun ? getProgressPercent(activeRun) : 0;
  const [detailScript, setDetailScript] = useState<Script | null>(null);

  return (
    <section className="panel card" style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">Run configuration</h2>
          <p className="section-subtitle">Choose one profile URL and open one tab per selected script. Each tab will submit once and remain open.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="button secondary" onClick={onSelectAllScripts} type="button">
            Select All
          </button>
          <button className="button secondary" onClick={onClearAllScripts} type="button">
            Clear All
          </button>
          <button className="button" onClick={onStartRun} type="button">
            Open Tabs and Submit Scripts
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="run-batch">Batch name</label>
        <select id="run-batch" value={selectedBatchId} onChange={(event) => onSelectBatch(event.target.value)}>
          <option value="">Select a batch</option>
          {batches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="run-profile">Gem Profile</label>
        <select id="run-profile" value={selectedProfileId} onChange={(event) => onSelectProfile(event.target.value)}>
          <option value="">Select a profile</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="run-input-field">Script field to submit</label>
        <select id="run-input-field" value={selectedInputField} onChange={(event) => onSelectInputField(event.target.value as RunInputField)}>
          <option value="content">Content</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div className="panel" style={{ borderRadius: 16, padding: 14, display: 'grid', gap: 6 }}>
        <strong>Launch behavior</strong>
        <div style={{ color: '#bfd0ea', fontSize: 13 }}>- One selected script = one browser tab.</div>
        <div style={{ color: '#bfd0ea', fontSize: 13 }}>- The extension will input and send the script once.</div>
        <div style={{ color: '#bfd0ea', fontSize: 13 }}>- Submitted tabs stay open for manual review or later output handling.</div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <h3 className="section-title">Scripts in batch</h3>
          <p className="section-subtitle">Batch: {batch?.name ?? '—'}. Only enabled scripts are shown as selectable run inputs.</p>
        </div>
        <div style={{ display: 'grid', gap: 10, maxHeight: '42vh', overflowY: 'auto', paddingRight: 4 }}>
          {batch?.scripts.map((script) => (
            <label
              key={script.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                borderRadius: 16,
                border: '1px solid rgba(148, 163, 184, 0.16)',
                background: script.enabled ? 'rgba(15, 23, 42, 0.48)' : 'rgba(15, 23, 42, 0.18)',
                opacity: script.enabled ? 1 : 0.55,
              }}
            >
              <input
                type="checkbox"
                checked={selectedScriptIds.includes(script.id)}
                disabled={!script.enabled}
                onChange={() => onToggleScript(script.id)}
              />
              <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                <strong>{script.title}</strong>
                <div style={{ color: '#9fb1cd', fontSize: 13 }}>NumberNo: {script.numberNo || '—'}</div>
                <div style={{ color: '#9fb1cd', fontSize: 13 }}>Batch: {batch?.name ?? '—'}</div>
                <div style={{ color: '#bfd0ea', fontSize: 13 }}>{script.content.length} chars · submit field: {selectedInputField}</div>
                <button
                  type="button"
                  className="button secondary"
                  style={{ width: 'fit-content' }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDetailScript(script);
                  }}
                >
                  View detail
                </button>
              </div>
            </label>
          ))}
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="field-error">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      {activeRun ? (
        <div className="panel card" style={{ padding: 16, borderRadius: 16, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <strong>Launch state</strong>
              <div style={{ color: '#9fb1cd', fontSize: 13 }}>{activeRun.id}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="button secondary" onClick={onPauseRun} type="button" disabled={!canPause}>
                Pause
              </button>
              <button className="button secondary" onClick={onResumeRun} type="button" disabled={!canResume}>
                Resume
              </button>
              <button className="button secondary" onClick={onStopRun} type="button" disabled={!canStop}>
                Stop New Tabs
              </button>
              <button className="button secondary" onClick={onRetryCurrentJob} type="button" disabled={!canRetryJob}>
                Retry Current Launch
              </button>
              <button className="button secondary" onClick={onResetRunState} type="button" disabled={!canReset}>
                Reset Run State
              </button>
              <button className="button secondary" onClick={onClearActiveRun} type="button" disabled={!canClear}>
                Clear Run State
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ height: 10, borderRadius: 999, background: 'rgba(148, 163, 184, 0.14)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                  transition: 'width 180ms ease',
                }}
              />
            </div>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>{progressPercent}% submitted</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>
              <strong>Status:</strong> {activeRun.status}
            </div>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>
              <strong>Total tabs:</strong> {activeRun.jobs.length}
            </div>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>
              <strong>Submitted:</strong> {activeRun.progress.submittedJobs}
            </div>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>
              <strong>Failed:</strong> {activeRun.progress.failedJobs}
            </div>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>
              <strong>Stopped:</strong> {activeRun.progress.stoppedJobs}
            </div>
            <div style={{ color: '#bfd0ea', fontSize: 13 }}>
              <strong>Current script:</strong> {activeRun.progress.currentScriptId ?? '—'}
            </div>
          </div>

          <div style={{ color: '#dce8fb', fontSize: 14 }}>
            <strong>Current step:</strong> {activeRun.progress.currentStepLabel}
          </div>
          <div style={{ color: '#bfd0ea', fontSize: 13 }}>
            <strong>Last update:</strong> {activeRun.progress.lastMessage}
          </div>
          {activeRun.progress.lastError ? (
            <div className="field-error">Last error: {activeRun.progress.lastError}</div>
          ) : null}
        </div>
      ) : null}

      {submitMessage ? <div className="badge">{submitMessage}</div> : null}

      {detailScript ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailScript(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(2, 6, 23, 0.72)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
          }}
        >
          <div className="panel card" onClick={(event) => event.stopPropagation()} style={{ width: 'min(820px, 100%)', maxHeight: '85vh', overflow: 'auto', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <h3 className="section-title" style={{ marginBottom: 6 }}>Script detail</h3>
                <p className="section-subtitle">{detailScript.title}</p>
              </div>
              <button type="button" className="button secondary" onClick={() => setDetailScript(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
                <div style={{ color: '#9fb1cd', fontSize: 12 }}>NumberNo</div>
                <strong>{detailScript.numberNo || '—'}</strong>
              </div>
              <div className="panel" style={{ borderRadius: 14, padding: 12 }}>
                <div style={{ color: '#9fb1cd', fontSize: 12 }}>Selected submit field</div>
                <strong>{selectedInputField}</strong>
              </div>
            </div>
            <div className="field">
              <label>Title</label>
              <textarea readOnly value={detailScript.title} rows={3} />
            </div>
            <div className="field">
              <label>Content</label>
              <textarea readOnly value={detailScript.content} rows={10} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
