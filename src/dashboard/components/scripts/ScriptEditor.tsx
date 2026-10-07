import type { Script, ScriptBatch } from '../../../core/models';
import type { validateScriptBatch } from '../../../core/validation';

interface ScriptEditorProps {
  batch: ScriptBatch | null;
  selectedScript: Script | null;
  saveState: 'idle' | 'saving' | 'saved';
  validation: ReturnType<typeof validateScriptBatch> | null;
  onChangeBatchName: (name: string) => void;
  onUpdateScript: (patch: Partial<Script>) => void;
  onResetBatch: () => void;
}

export function ScriptEditor({
  batch,
  selectedScript,
  saveState,
  validation,
  onChangeBatchName,
  onUpdateScript,
  onResetBatch,
}: ScriptEditorProps) {
  if (!batch || !selectedScript) {
    return (
      <section className="panel card">
        <h2 className="section-title">Script editor</h2>
        <p className="section-subtitle">Select a script to start editing.</p>
      </section>
    );
  }

  return (
    <section className="panel card section-stack script-editor-panel">
      <div className="section-toolbar align-start">
        <div>
          <h2 className="section-title">Script batch editor</h2>
          <p className="section-subtitle">Manage scripts by batch name. Autosaves after changes. Status: {saveState}</p>
        </div>
        <button className="button secondary" onClick={onResetBatch} type="button">
          Reset Default Batch
        </button>
      </div>

      <div className="field">
        <label htmlFor="batch-name">Batch name</label>
        <input id="batch-name" value={batch.name} onChange={(event) => onChangeBatchName(event.target.value)} />
      </div>

      {validation?.errors.length ? (
        <div className="field-error" style={{ maxHeight: 140, overflowY: 'auto' }}>
          {validation.errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="script-number-no">NumberNo</label>
          <input id="script-number-no" value={selectedScript.numberNo ?? ''} onChange={(event) => onUpdateScript({ numberNo: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="script-title">Video title</label>
          <input id="script-title" value={selectedScript.title} onChange={(event) => onUpdateScript({ title: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="script-enabled">Availability</label>
          <select
            id="script-enabled"
            value={selectedScript.enabled ? 'enabled' : 'disabled'}
            onChange={(event) => onUpdateScript({ enabled: event.target.value === 'enabled' })}
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div className="field">
          <label>Character count</label>
          <div className="badge">{selectedScript.content.length} chars</div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="script-content">Content</label>
        <textarea
          id="script-content"
          rows={16}
          value={selectedScript.content}
          onChange={(event) => onUpdateScript({ content: event.target.value })}
          placeholder="Paste or type the Gemini input script here."
        />
      </div>
    </section>
  );
}
