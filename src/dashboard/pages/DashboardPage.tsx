export function DashboardPage() {
  const quickActions = [
    { label: 'Add Gemini Profile', hash: '#/profiles' },
    { label: 'Create Script Batch', hash: '#/scripts' },
    { label: 'Import Google Sheet', hash: '#/google-sheets' },
    { label: 'Start Run', hash: '#/run' },
  ];

  return (
    <div className="dashboard-grid">
      <section className="metric-grid">
        <div className="metric-card">
          <span>Profiles</span>
          <strong>Manage</strong>
          <small>Gemini profile setup</small>
        </div>
        <div className="metric-card">
          <span>Scripts</span>
          <strong>Prepare</strong>
          <small>Batches and stages</small>
        </div>
        <div className="metric-card">
          <span>Run</span>
          <strong>Automate</strong>
          <small>Launch Gemini flows</small>
        </div>
        <div className="metric-card">
          <span>Results</span>
          <strong>Review</strong>
          <small>Outputs and write-back</small>
        </div>
      </section>

      <section className="panel card section-stack">
        <div>
          <h2 className="section-title">Automation Control Center</h2>
          <p className="section-subtitle">
            Use the sidebar to configure profiles, prepare script batches, connect Google Sheets, run automation,
            and inspect outputs without changing your existing workflow.
          </p>
        </div>
        <div className="step-list">
          <div className="step-item">
            <strong>Configure Profiles</strong>
            <span>Set up Gemini profiles and stage behavior.</span>
          </div>
          <div className="step-item">
            <strong>Prepare Scripts</strong>
            <span>Organize batches, scripts, and fixed stages before a run.</span>
          </div>
          <div className="step-item">
            <strong>Launch and Monitor</strong>
            <span>Start automation, review runtime status, and inspect saved results.</span>
          </div>
        </div>
      </section>

      <section className="panel card section-stack">
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Jump to the most common workflow steps.</p>
        </div>
        <div className="quick-action-grid">
          {quickActions.map((action) => (
            <button
              key={action.hash}
              type="button"
              className="button secondary"
              onClick={() => {
                window.location.hash = action.hash;
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
