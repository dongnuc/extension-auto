import { useMemo, useState } from 'react';
import { createDefaultStage } from '../../../core/factories';
import type { GemProfile, Stage, StageInputType } from '../../../core/models';
import { validateProfile } from '../../../core/validation';
import { nowIso } from '../../../shared/utils/time';
import { StageListEditor } from './StageListEditor';

interface ProfileEditorProps {
  profile: GemProfile | null;
  onChange: (updater: (profile: GemProfile) => GemProfile) => void;
  onSave: () => Promise<{ ok: boolean; message?: string }>;
}

function reorderStages(stages: Stage[], stageId: string, direction: 'up' | 'down') {
  const index = stages.findIndex((stage) => stage.id === stageId);
  if (index < 0) {
    return stages;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= stages.length) {
    return stages;
  }

  const next = [...stages];
  const [stage] = next.splice(index, 1);
  next.splice(targetIndex, 0, stage);
  return next.map((item, order) => ({ ...item, order }));
}

export function ProfileEditor({ profile, onChange, onSave }: ProfileEditorProps) {
  const [saveMessage, setSaveMessage] = useState<string>('');
  const validation = useMemo(() => (profile ? validateProfile(profile) : null), [profile]);

  if (!profile) {
    return (
      <section className="panel card">
        <h2 className="section-title">Profile editor</h2>
        <p className="section-subtitle">Select or create a profile to start editing.</p>
      </section>
    );
  }

  const setField = <K extends keyof GemProfile>(key: K, value: GemProfile[K]) => {
    onChange((current) => ({
      ...current,
      [key]: value,
      updatedAt: nowIso(),
    }));
  };

  const setStageField = (stageId: string, patch: Partial<Stage>) => {
    onChange((current) => ({
      ...current,
      stages: current.stages.map((stage) => (stage.id === stageId ? { ...stage, ...patch } : stage)),
      updatedAt: nowIso(),
    }));
  };

  const addStage = (type: StageInputType) => {
    onChange((current) => {
      const stages = [...current.stages, createDefaultStage(current.stages.length, type)];
      return {
        ...current,
        stages,
        outputStageId: current.outputStageId || stages[0]?.id || '',
        updatedAt: nowIso(),
      };
    });
  };

  const deleteStage = (stageId: string) => {
    onChange((current) => {
      const remaining = current.stages.filter((stage) => stage.id !== stageId);
      const nextOutputId = current.outputStageId === stageId ? (remaining[0]?.id ?? '') : current.outputStageId;
      return {
        ...current,
        stages: remaining.map((stage, order) => ({ ...stage, order })),
        outputStageId: nextOutputId,
        updatedAt: nowIso(),
      };
    });
  };

  const moveStage = (stageId: string, direction: 'up' | 'down') => {
    onChange((current) => ({
      ...current,
      stages: reorderStages(current.stages, stageId, direction),
      updatedAt: nowIso(),
    }));
  };

  const saveProfile = async () => {
    const result = await onSave();
    setSaveMessage(result.ok ? 'Profile saved successfully.' : (result.message ?? 'Unable to save profile.'));
  };

  return (
    <section className="panel card section-stack profile-editor-panel">
      <div className="section-toolbar align-start">
        <div>
          <h2 className="section-title">Profile editor</h2>
          <p className="section-subtitle">Configure the Gemini Gem URL, stages, output stage, and export options.</p>
        </div>
        <button className="button" onClick={saveProfile} type="button">
          Save Profile
        </button>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="profile-id">Profile ID</label>
          <input id="profile-id" value={profile.id} onChange={(event) => setField('id', event.target.value)} />
          {validation?.fields.id ? <div className="field-error">{validation.fields.id}</div> : null}
        </div>
        <div className="field">
          <label htmlFor="profile-name">Profile name</label>
          <input id="profile-name" value={profile.name} onChange={(event) => setField('name', event.target.value)} />
          {validation?.fields.name ? <div className="field-error">{validation.fields.name}</div> : null}
        </div>
        <div className="field">
          <label htmlFor="profile-url">Base URL</label>
          <input id="profile-url" value={profile.baseUrl} onChange={(event) => setField('baseUrl', event.target.value)} />
          {validation?.fields.baseUrl ? <div className="field-error">{validation.fields.baseUrl}</div> : null}
        </div>
        <div className="field">
          <label htmlFor="profile-gem-name">Expected Gem name</label>
          <input
            id="profile-gem-name"
            value={profile.expectedGemName}
            onChange={(event) => setField('expectedGemName', event.target.value)}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="profile-enabled">Availability</label>
          <select
            id="profile-enabled"
            value={profile.enabled ? 'enabled' : 'disabled'}
            onChange={(event) => setField('enabled', event.target.value === 'enabled')}
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="profile-output">Output stage</label>
          <select
            id="profile-output"
            value={profile.outputStageId}
            onChange={(event) => setField('outputStageId', event.target.value)}
          >
            {profile.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name} ({stage.id})
              </option>
            ))}
          </select>
          {validation?.fields.outputStageId ? <div className="field-error">{validation.fields.outputStageId}</div> : null}
        </div>
        <div className="field">
          <label htmlFor="profile-export-mode">Export mode</label>
          <select
            id="profile-export-mode"
            value={profile.exportConfig.mode}
            onChange={(event) =>
              setField('exportConfig', {
                ...profile.exportConfig,
                mode: event.target.value as GemProfile['exportConfig']['mode'],
              })
            }
          >
            <option value="per_script">per_script</option>
            <option value="combined">combined</option>
            <option value="both">both</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="profile-filename-template">Filename template</label>
          <input
            id="profile-filename-template"
            value={profile.exportConfig.filenameTemplate}
            onChange={(event) =>
              setField('exportConfig', {
                ...profile.exportConfig,
                filenameTemplate: event.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="profile-max-retries">Profile retry count</label>
          <input
            id="profile-max-retries"
            min={0}
            type="number"
            value={profile.errorPolicy.maxProfileRetries}
            onChange={(event) =>
              setField('errorPolicy', {
                ...profile.errorPolicy,
                maxProfileRetries: Number(event.target.value),
              })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="profile-continue-on-error">On stage failure</label>
          <select
            id="profile-continue-on-error"
            value={profile.errorPolicy.continueOnStageFailure ? 'continue' : 'stop'}
            onChange={(event) =>
              setField('errorPolicy', {
                ...profile.errorPolicy,
                continueOnStageFailure: event.target.value === 'continue',
              })
            }
          >
            <option value="stop">Stop run</option>
            <option value="continue">Continue run</option>
          </select>
        </div>
      </div>

      {validation?.global.length ? (
        <div className="field-error">
          {validation.global.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      <StageListEditor
        stages={profile.stages}
        outputStageId={profile.outputStageId}
        stageErrors={validation?.stageErrors ?? {}}
        onAddStage={addStage}
        onDeleteStage={deleteStage}
        onMoveStage={moveStage}
        onChangeStage={setStageField}
        onSelectOutput={(stageId) => setField('outputStageId', stageId)}
      />

      {saveMessage ? <div className="badge">{saveMessage}</div> : null}
    </section>
  );
}
