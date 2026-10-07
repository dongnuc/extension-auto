import { useState } from 'react';
import type { RunCalendarEntry } from '../../core/models';
import { useRunCalendar } from '../hooks/useRunCalendar';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getStatusBadgeClass(status: string): string {
  const normalized = status === 'launching' || status === 'submitted' ? 'running' : status === 'stopped' ? 'warning' : status;
  return `status-badge ${normalized}`;
}

export function RunCalendarPage() {
  const { entries, loading, message, deleteEntry, recoverEntry } = useRunCalendar();
  const [detailEntry, setDetailEntry] = useState<RunCalendarEntry | null>(null);

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading run calendar...</h2>
      </section>
    );
  }

  return (
    <div className="section-stack">
      <section className="panel card section-stack">
        <div>
          <h2 className="section-title">Run Calendar</h2>
          <p className="section-subtitle">Simple calendar of runs. This keeps NumberNo and generated profile links even when detailed run rows are deleted from Results.</p>
        </div>

        {message ? (
          <div className="badge" style={{ width: 'fit-content' }}>{message}</div>
        ) : null}

        {entries.length === 0 ? (
          <div className="panel" style={{ borderRadius: 16, padding: 16, color: '#9fb1cd' }}>
            No calendar snapshots yet. Start a run to create the first entry.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '72vh', overflowY: 'auto' }}>
            <table className="data-table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Run time</th>
                  <th>Profile</th>
                  <th>Status</th>
                  <th>Scripts</th>
                  <th>Run ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.runId}>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td><strong>{entry.profileName || '—'}</strong></td>
                    <td><span className={getStatusBadgeClass(entry.status)}>{entry.status}</span></td>
                    <td>{entry.items.length}</td>
                    <td style={{ wordBreak: 'break-all' }}>{entry.runId}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="button secondary" onClick={() => setDetailEntry(entry)}>
                          View detail
                        </button>
                        <button type="button" className="button secondary" onClick={() => void recoverEntry(entry.runId)}>
                          Recover to Results
                        </button>
                        <button type="button" className="button secondary" onClick={() => void deleteEntry(entry.runId)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailEntry ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailEntry(null)}
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
          <div className="panel card" onClick={(event) => event.stopPropagation()} style={{ width: 'min(980px, 100%)', maxHeight: '85vh', overflow: 'hidden', display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <h3 className="section-title" style={{ marginBottom: 6 }}>Run detail</h3>
                <p className="section-subtitle">{detailEntry.profileName} · {formatDate(detailEntry.createdAt)}</p>
              </div>
              <button type="button" className="button secondary" onClick={() => setDetailEntry(null)}>Close</button>
            </div>

            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '64vh' }}>
              <table className="data-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>NumberNo</th>
                    <th>Script title</th>
                    <th>Profile link</th>
                    <th>Generated link</th>
                    <th>Row</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailEntry.items.map((item) => (
                    <tr key={item.scriptId}>
                      <td><strong>{item.numberNo || '—'}</strong></td>
                      <td>{item.scriptTitle || '—'}</td>
                      <td>
                        {item.profileUrl ? (
                          <a href={item.profileUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
                            Open profile
                          </a>
                        ) : <span style={{ color: '#9fb1cd', fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        {item.generatedUrl ? (
                          <a href={item.generatedUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
                            {item.generatedUrl}
                          </a>
                        ) : <span style={{ color: '#9fb1cd', fontSize: 12 }}>—</span>}
                      </td>
                      <td>{item.rowNumber ?? '—'}</td>
                      <td><span className={getStatusBadgeClass(item.status)}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
