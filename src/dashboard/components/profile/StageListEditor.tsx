import type { Stage, StageInputType } from '../../../core/models';

interface StageListEditorProps {
  stages: Stage[];
  outputStageId: string;
  stageErrors: Record<string, string[]>;
  onAddStage: (type: StageInputType) => void;
  onDeleteStage: (stageId: string) => void;
  onMoveStage: (stageId: string, direction: 'up' | 'down') => void;
  onChangeStage: (stageId: string, patch: Partial<Stage>) => void;
  onSelectOutput: (stageId: string) => void;
}

export function StageListEditor({
  stages,
  outputStageId,
  stageErrors,
  onAddStage,
  onDeleteStage,
  onMoveStage,
  onChangeStage,
  onSelectOutput,
}: StageListEditorProps) {
  return (
    <section className="panel card" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 className="section-title">Stages</h3>
          <p className="section-subtitle">Define the prompts that run sequentially inside the same Gemini Gem conversation.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="button secondary" onClick={() => onAddStage('script')} type="button">
            Add Script Stage
          </button>
          <button className="button secondary" onClick={() => onAddStage('fixed')} type="button">
            Add Fixed Stage
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {stages.map((stage, index) => (
          <article
            key={stage.id}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.16)',
              borderRadius: 18,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.55)',
              display: 'grid',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <strong>{stage.name || `Stage ${index + 1}`}</strong>
                <div style={{ color: '#9fb1cd', fontSize: 13 }}>{stage.id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <input
                    checked={outputStageId === stage.id}
                    name="outputStage"
                    onChange={() => onSelectOutput(stage.id)}
                    type="radio"
                  />
                  Output stage
                </label>
                <button className="button ghost" onClick={() => onMoveStage(stage.id, 'up')} type="button" disabled={index === 0}>
                  Up
                </button>
                <button
                  className="button ghost"
                  onClick={() => onMoveStage(stage.id, 'down')}
                  type="button"
                  disabled={index === stages.length - 1}
                >
                  Down
                </button>
                <button className="button ghost" onClick={() => onDeleteStage(stage.id)} type="button">
                  Delete
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="field">
                <label htmlFor={`stage-name-${stage.id}`}>Stage name</label>
                <input
                  id={`stage-name-${stage.id}`}
                  value={stage.name}
                  onChange={(event) => onChangeStage(stage.id, { name: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor={`stage-type-${stage.id}`}>Type</label>
                <select
                  id={`stage-type-${stage.id}`}
                  value={stage.type}
                  onChange={(event) => onChangeStage(stage.id, { type: event.target.value as StageInputType })}
                >
                  <option value="script">script</option>
                  <option value="fixed">fixed</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`stage-timeout-${stage.id}`}>Timeout (ms)</label>
                <input
                  id={`stage-timeout-${stage.id}`}
                  min={1}
                  type="number"
                  value={stage.timeoutMs}
                  onChange={(event) => onChangeStage(stage.id, { timeoutMs: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor={`stage-stable-${stage.id}`}>Stable seconds</label>
                <input
                  id={`stage-stable-${stage.id}`}
                  min={0}
                  type="number"
                  value={stage.stableSeconds}
                  onChange={(event) => onChangeStage(stage.id, { stableSeconds: Number(event.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor={`stage-retry-${stage.id}`}>Retry count</label>
                <input
                  id={`stage-retry-${stage.id}`}
                  min={0}
                  type="number"
                  value={stage.retryCount}
                  onChange={(event) => onChangeStage(stage.id, { retryCount: Number(event.target.value) })}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor={`stage-value-${stage.id}`}>Stage value</label>
              <textarea
                id={`stage-value-${stage.id}`}
                rows={4}
                placeholder={stage.type === 'script' ? 'Script stages use the current script as input.' : 'Enter fixed prompt text.'}
                value={stage.value}
                onChange={(event) => onChangeStage(stage.id, { value: event.target.value })}
                disabled={stage.type === 'script'}
              />
            </div>

            {stageErrors[stage.id]?.length ? (
              <div className="field-error">
                {stageErrors[stage.id].map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
