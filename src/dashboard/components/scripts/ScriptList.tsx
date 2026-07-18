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
    <section className="panel card" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 className="section-title">Scripts</h2>
          <p className="section-subtitle">Manage scripts inside batch: {batchName}.</p>
        </div>
        <button className="button" onClick={onAdd} type="button">
          Add Script
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
        {scripts.map((script, index) => {
          const selected = script.id === selectedScriptId;
          return (
            <button
              key={script.id}
              type="button"
              className="button ghost"
              onClick={() => onSelect(script.id)}
              style={{
                textAlign: 'left',
                padding: 14,
                borderRadius: 16,
                background: selected ? 'rgba(37, 99, 235, 0.18)' : 'rgba(2, 6, 23, 0.32)',
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div>
                  <strong>{script.title || `Script ${index + 1}`}</strong>
                  <div style={{ color: '#9fb1cd', fontSize: 13 }}>NumberNo: {script.numberNo || script.id || '—'}</div>
                  <div style={{ color: '#9fb1cd', fontSize: 13 }}>Batch: {batchName}</div>
                </div>
                <span className="badge">{script.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div style={{ color: '#bfd0ea', fontSize: 13 }}>
                {script.content.length} chars
                {script.source ? ` · Sheet row ${script.source.sourceRowNumber} · output ${script.source.outputColumn}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="button secondary" onClick={onDuplicate} type="button">Duplicate</button>
      </div>
    </section>
  );
}
