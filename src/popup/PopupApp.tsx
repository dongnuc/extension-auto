import { useEffect, useState } from 'react';
import { runtimeMessageTypes, type PingBackgroundResponse, type RunStatusResponse } from '../shared/messaging/contracts';

function openDashboard(): void {
  const url = chrome.runtime.getURL('src/dashboard/index.html');
  void chrome.tabs.create({ url });
}

export function PopupApp() {
  const [health, setHealth] = useState<PingBackgroundResponse | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatusResponse | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: runtimeMessageTypes.pingBackground }, (response: PingBackgroundResponse) => {
      setHealth(response);
    });

    chrome.runtime.sendMessage({ type: runtimeMessageTypes.getRunStatus }, (response: RunStatusResponse) => {
      setRunStatus(response);
    });
  }, []);

  return (
    <main
      style={{
        width: 360,
        padding: 18,
        display: 'grid',
        gap: 16,
      }}
    >
      <section className="panel card">
        <span className="badge">Gem Auto Flow</span>
        <h1 style={{ margin: '12px 0 8px', fontSize: 22 }}>Ready to automate Gemini Gems</h1>
        <p style={{ margin: 0, color: '#aabbd6', fontSize: 14 }}>
          Open the dashboard to manage profiles, scripts, runs, and results.
        </p>
      </section>

      <section className="panel card" style={{ display: 'grid', gap: 10 }}>
        <div>
          <strong>Background:</strong>{' '}
          <span>{health?.message ?? 'Checking service worker...'}</span>
        </div>
        <div>
          <strong>Run status:</strong>{' '}
          <span>{runStatus?.status ?? 'Loading...'}</span>
        </div>
        <button className="button" onClick={openDashboard} type="button">
          Open Dashboard
        </button>
      </section>
    </main>
  );
}
