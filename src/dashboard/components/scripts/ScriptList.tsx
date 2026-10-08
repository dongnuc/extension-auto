import type { Script } from '../../../core/models';

interface ScriptListProps {
  scripts: Script[];
  selectedScriptId: string | null;
  batchName: string;
  onSelect: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
}

export function ScriptList({ scripts, selectedScriptId, batchName, onSelect, onDelete }: ScriptListProps) {
  return (
    <section className="panel card section-stack script-list-panel">
      <div>
        <h2 className="section-title">Scripts <span className="scripts-count">({scripts.length})</span></h2>
        <p className="section-subtitle">Scripts in {batchName}.</p>
      </div>

      <div className="compact-list scroll-list scripts-list-scroll">
        {scripts.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No scripts yet</h3>
            <p>Import scripts from Google Sheets to populate this batch.</p>
          </div>
        ) : scripts.map((script, index) => {
          const selected = script.id === selectedScriptId;
          const displayTitle = script.title || `Script ${index + 1}`;
          return (
            <div className={`script-list-row ${selected ? 'selected' : ''}`} key={script.id}>
              <button
                type="button"
                className="script-list-select"
                aria-pressed={selected}
                onClick={() => onSelect(script.id)}
              >
                <span className="script-number">{script.numberNo || `S${String(index + 1).padStart(3, '0')}`}</span>
                <span className="script-list-copy">
                  <strong>{displayTitle}</strong>
                  <small>{script.content.length.toLocaleString()} chars</small>
                </span>
                <span className={`status-badge ${script.enabled ? 'enabled' : 'disabled'}`}>
                  {script.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </button>
              <button
                className="script-delete-button"
                type="button"
                aria-label={`Delete ${displayTitle}`}
                title={`Delete ${displayTitle}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(script.id);
                }}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="m19 6-1 14H6L5 6" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
