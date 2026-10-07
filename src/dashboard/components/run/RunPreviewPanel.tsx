import type { GemProfile, Run, ScriptBatch } from '../../../core/models';

function getJobStatus(run: Run | null | undefined, scriptTitle: string): string {
  return run?.jobs.find((job) => job.scriptTitle === scriptTitle)?.status ?? 'pending';
}

function getJobStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
    case 'completed':
      return 'rgba(34, 197, 94, 0.18)';
    case 'launching':
    case 'running':
      return 'rgba(37, 99, 235, 0.16)';
    case 'failed':
      return 'rgba(239, 68, 68, 0.16)';
    case 'stopped':
      return 'rgba(245, 158, 11, 0.18)';
    default:
      return 'rgba(15, 23, 42, 0.48)';
  }
}

interface RunPreviewPanelProps {
  profile: GemProfile | null;
  batch: ScriptBatch | null;
  selectedScriptIds: string[];
  activeRun?: Run | null;
}

export function RunPreviewPanel({ profile, batch, selectedScriptIds, activeRun }: RunPreviewPanelProps) {
  const selectedScripts = batch?.scripts.filter((script) => selectedScriptIds.includes(script.id)) ?? [];

  return (
    <section className="panel card section-stack run-preview-panel">
      <div>
        <h2 className="section-title">Launch preview</h2>
        <p className="section-subtitle">Preview the profile URL and the browser tabs that will be opened when you submit the selected scripts.</p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div><strong>Profile:</strong> {profile?.name ?? '—'}</div>
        <div>
          <strong>Base URL:</strong>{' '}
          {profile?.baseUrl ? (
            <a href={profile.baseUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all' }}>
              {profile.baseUrl}
            </a>
          ) : '—'}
        </div>
        <div><strong>Batch:</strong> {batch?.name ?? '—'}</div>
        <div><strong>Selected scripts:</strong> {selectedScripts.length}</div>
        <div><strong>Tabs to open:</strong> {selectedScripts.length}</div>
        {activeRun ? <div><strong>Current step:</strong> {activeRun.progress.currentStepLabel}</div> : null}
        {activeRun ? <div><strong>Progress message:</strong> {activeRun.progress.lastMessage}</div> : null}
        {activeRun?.progress.lastError ? <div><strong>Current error:</strong> {activeRun.progress.lastError}</div> : null}
      </div>

      <div className="panel card nested-section compact-info-card">
        <strong>How this run works</strong>
        <div style={{ color: '#bfd0ea', fontSize: 13 }}>- The extension opens one Gemini tab per selected script.</div>
        <div style={{ color: '#bfd0ea', fontSize: 13 }}>- It inserts the script content once and sends it immediately.</div>
        <div style={{ color: '#bfd0ea', fontSize: 13 }}>- Tabs stay open after submission for manual inspection and later output handling.</div>
      </div>

      <div className="compact-list scroll-list launch-queue-list">
        <div>
          <h3 className="section-title">Tab launch queue</h3>
        </div>
        {selectedScripts.map((script, index) => {
          const isCurrent = activeRun?.jobs[activeRun.currentJobIndex]?.scriptTitle === script.title;
          const jobStatus = getJobStatus(activeRun, script.title);
          const job = activeRun?.jobs.find((item) => item.scriptTitle === script.title);
          return (
            <article
              key={script.id}
              className="launch-queue-card"
              style={{ background: isCurrent ? 'rgba(37, 99, 235, 0.16)' : getJobStatusColor(jobStatus) }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong>{index + 1}. {script.title}</strong>
                <span className="badge">{jobStatus}</span>
              </div>
              <div style={{ color: '#9fb1cd', fontSize: 13 }}>Batch: {batch?.name ?? '—'}</div>
              <div style={{ color: '#bfd0ea', fontSize: 13 }}>{script.content.length} chars</div>
              <div style={{ color: '#bfd0ea', fontSize: 13 }}>Tab ID: {job?.tabId ?? '—'}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
