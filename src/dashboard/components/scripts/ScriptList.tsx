import type { Script } from '../../../core/models';

interface ScriptListProps {
  scripts: Script[];
  selectedScriptId: string | null;
  batchName: string;
  onSelect: (scriptId: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleEnabled: (scriptId: string, enabled: boolean) => void;
  onMove: (scriptId: string, direction: 'up' | 'down') => void;
}

export function ScriptList({ scripts, selectedScriptId, batchName, onSelect, onAdd, onDuplicate, onDelete, onToggleEnabled, onMove }: ScriptListProps) {
  return (
    <section className="panel card section-stack script-list-panel">
      <div className="section-toolbar">
        <div>
          <h2 className="section-title">Scripts</h2>
          <p className="section-subtitle">Manage scripts inside batch: {batchName}.</p>
        </div>
        <button className="button" onClick={onAdd} type="button">
          Add Script
        </button>
      </div>

      <div className="compact-list scroll-list">
        {scripts.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No scripts yet</h3>
            <p>Add a script manually or import rows from Google Sheets.</p>
          </div>
        ) : scripts.map((script, index) => {
          const selected = script.id === selectedScriptId;
          return (
            <button
              key={script.id}
              type="button"
              className={`selectable-card ${selected ? 'selected' : ''}`}
              onClick={() => onSelect(script.id)}
            >
              <div className="selectable-card-header">
                <div>
                  <strong>{script.title || `Script ${index + 1}`}</strong>
                  <span>NumberNo: {script.numberNo || script.id || '—'}</span>
                  <span>Batch: {batchName}</span>
                </div>
                <span className={`status-badge ${script.enabled ? 'enabled' : 'disabled'}`}>{script.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="meta-row">
                <span>{script.content.length} chars</span>
                {script.source ? <span>Sheet row {script.source.sourceRowNumber} · output {script.source.outputColumn}</span> : null}
              </div>
              <div className="action-row compact-actions">
                <button className="button ghost" type="button" onClick={(event) => { event.stopPropagation(); onMove(script.id, 'up'); }} disabled={index === 0}>
                  Up
                </button>
                <button className="button ghost" type="button" onClick={(event) => { event.stopPropagation(); onMove(script.id, 'down'); }} disabled={index === scripts.length - 1}>
                  Down
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleEnabled(script.id, !script.enabled);
                  }}
                >
                  {script.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(script.id);
                    onDelete();
                  }}
                >
                  Delete
                </button>
              </div>
            </button>
          );
        })}
      </div>

      <div className="action-row">
        <button className="button secondary" onClick={onDuplicate} type="button">Duplicate</button>
      </div>
    </section>
  );
}
