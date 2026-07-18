import { useState } from 'react';
import type { RunCalendarEntry } from '../../core/models';
import { useRunCalendar } from '../hooks/useRunCalendar';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function RunCalendarPage() {
  const { entries, loading, deleteEntry } = useRunCalendar();
  const [detailEntry, setDetailEntry] = useState<RunCalendarEntry | null>(null);

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading run calendar...</h2>
      </section>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel card" style={{ display: 'grid', gap: 16 }}>
        <div>
          <h2 className="section-title">Run Calendar</h2>
          <p className="section-subtitle">Simple calendar of runs. This keeps NumberNo and generated profile links even when detailed run rows are deleted from Results.</p>
        </div>

        {entries.length === 0 ? (
          <div className="panel" style={{ borderRadius: 16, padding: 16, color: '#9fb1cd' }}>
            No calendar snapshots yet. Start a run to create the first entry.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '72vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: 920 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Run time</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Profile</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Status</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Scripts</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Run ID</th>
                  <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.runId}>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div className="panel" style={{ borderRadius: 16, padding: 12, display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.7fr 0.7fr 1.4fr 1fr', gap: 12, alignItems: 'center' }}>
                        <div style={{ color: '#bfd0ea', fontSize: 13 }}>{formatDate(entry.createdAt)}</div>
                        <strong>{entry.profileName || '—'}</strong>
                        <span className="badge" style={{ width: 'fit-content' }}>{entry.status}</span>
                        <div style={{ color: '#bfd0ea', fontSize: 13 }}>{entry.items.length}</div>
                        <div style={{ color: '#9fb1cd', fontSize: 12, wordBreak: 'break-all' }}>{entry.runId}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="button" onClick={() => setDetailEntry(entry)}>
                            View detail
                          </button>
                          <button type="button" className="button secondary" onClick={() => void deleteEntry(entry.runId)}>
                            Delete
                          </button>
                        </div>
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
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: 760 }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>NumberNo</th>
                    <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Script title</th>
                    <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Profile link</th>
                    <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Generated link</th>
                    <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Row</th>
                    <th style={{ padding: '8px 10px', color: '#9fb1cd', fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailEntry.items.map((item) => (
                    <tr key={item.scriptId}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="panel" style={{ borderRadius: 14, padding: 12, display: 'grid', gridTemplateColumns: '0.9fr 1.3fr 1.3fr 1.5fr 0.5fr 0.7fr', gap: 12, alignItems: 'start' }}>
                          <strong>{item.numberNo || '—'}</strong>
                          <div style={{ color: '#bfd0ea', fontSize: 13 }}>{item.scriptTitle || '—'}</div>
                          <div>
                            {item.profileUrl ? (
                              <a href={item.profileUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all', fontSize: 13 }}>
                                Open profile
                              </a>
                            ) : <span style={{ color: '#9fb1cd', fontSize: 12 }}>—</span>}
                          </div>
                          <div>
                            {item.generatedUrl ? (
                              <a href={item.generatedUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all', fontSize: 13 }}>
                                {item.generatedUrl}
                              </a>
                            ) : <span style={{ color: '#9fb1cd', fontSize: 12 }}>—</span>}
                          </div>
                          <div style={{ color: '#bfd0ea', fontSize: 13 }}>{item.rowNumber ?? '—'}</div>
                          <span className="badge" style={{ width: 'fit-content' }}>{item.status}</span>
                        </div>
                      </td>
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
