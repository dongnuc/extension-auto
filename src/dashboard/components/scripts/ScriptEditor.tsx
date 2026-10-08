import type { Script } from '../../../core/models';
import type { validateScriptBatch } from '../../../core/validation';

interface ScriptEditorProps {
  selectedScript: Script | null;
  saveState: 'idle' | 'saving' | 'saved';
  validation: ReturnType<typeof validateScriptBatch> | null;
  onUpdateScript: (patch: Partial<Script>) => void;
}

export function ScriptEditor({
  selectedScript,
  saveState,
  validation,
  onUpdateScript,
}: ScriptEditorProps) {
  if (!selectedScript) {
    return (
      <section className="panel card script-editor-panel">
        <h2 className="section-title">Script editor</h2>
        <p className="section-subtitle">Select a script to start editing.</p>
      </section>
    );
  }

  return (
    <section className="panel card section-stack script-editor-panel">
      <div className="section-toolbar align-start">
        <div>
          <h2 className="section-title">Script editor</h2>
          <p className="section-subtitle">Edit script details and content. Changes are auto-saved.</p>
        </div>
        <span className={`save-state save-state-${saveState}`}>{saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Auto-saved' : 'Ready'}</span>
      </div>

      {validation?.errors.length ? (
        <div className="field-error script-validation-errors">
          {validation.errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      <div className="scripts-editor-fields">
        <div className="field">
          <label htmlFor="script-number-no">NumberNo</label>
          <input id="script-number-no" value={selectedScript.numberNo ?? ''} onChange={(event) => onUpdateScript({ numberNo: event.target.value })} />
        </div>
        <div className="field scripts-title-field">
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
          <div className="script-character-count">{selectedScript.content.length.toLocaleString()} chars</div>
        </div>
      </div>

      <div className="field scripts-content-field">
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
