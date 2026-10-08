import { useMemo, useState } from 'react';
import { createDefaultProfile } from '../../core/factories';
import type { GemProfile } from '../../core/models';
import { validateProfile } from '../../core/validation';
import { nowIso } from '../../shared/utils/time';
import { useProfiles } from '../hooks/useProfiles';

interface ProfileDraft {
  name: string;
  baseUrl: string;
  expectedGemName: string;
  enabled: boolean;
  exportMode: GemProfile['exportConfig']['mode'];
  filenameTemplate: string;
  maxProfileRetries: number;
  continueOnStageFailure: boolean;
}

function createInitialDraft(): ProfileDraft {
  const profile = createDefaultProfile();
  return {
    name: '',
    baseUrl: profile.baseUrl,
    expectedGemName: profile.expectedGemName,
    enabled: profile.enabled,
    exportMode: profile.exportConfig.mode,
    filenameTemplate: profile.exportConfig.filenameTemplate,
    maxProfileRetries: profile.errorPolicy.maxProfileRetries,
    continueOnStageFailure: profile.errorPolicy.continueOnStageFailure,
  };
}

function draftFromProfile(profile: GemProfile): ProfileDraft {
  return {
    name: profile.name,
    baseUrl: profile.baseUrl,
    expectedGemName: profile.expectedGemName,
    enabled: profile.enabled,
    exportMode: profile.exportConfig.mode,
    filenameTemplate: profile.exportConfig.filenameTemplate,
    maxProfileRetries: profile.errorPolicy.maxProfileRetries,
    continueOnStageFailure: profile.errorPolicy.continueOnStageFailure,
  };
}

function applyDraftToProfile(draft: ProfileDraft, baseProfile?: GemProfile): GemProfile {
  const profile = baseProfile ?? createDefaultProfile();
  const timestamp = nowIso();
  return {
    ...profile,
    name: draft.name.trim() || 'New Gemini Profile',
    baseUrl: draft.baseUrl.trim(),
    expectedGemName: draft.expectedGemName.trim(),
    enabled: draft.enabled,
    exportConfig: {
      mode: draft.exportMode,
      filenameTemplate: draft.filenameTemplate.trim() || '{{scriptId}}.txt',
    },
    errorPolicy: {
      maxProfileRetries: draft.maxProfileRetries,
      continueOnStageFailure: draft.continueOnStageFailure,
    },
    createdAt: baseProfile?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

interface ProfileModalProps {
  mode: 'create' | 'edit';
  draft: ProfileDraft;
  validation: ReturnType<typeof validateProfile>;
  message: string;
  onChange: (draft: ProfileDraft) => void;
  onClose: () => void;
  onSave: () => void;
}

function ProfileModal({ mode, draft, validation, message, onChange, onClose, onSave }: ProfileModalProps) {
  const prefix = mode === 'create' ? 'new' : 'edit';
  const title = mode === 'create' ? 'New Gemini Profile' : 'Edit Gemini Profile';
  const subtitle = mode === 'create'
    ? 'Create a profile with an auto-generated ID. The first stage is always a Script stage.'
    : 'Update the selected profile. Profile ID and stage structure are managed automatically.';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={`${prefix}-profile-title`} onClick={onClose}>
      <section className="panel card create-profile-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-toolbar align-start">
          <div>
            <h2 id={`${prefix}-profile-title`} className="section-title">{title}</h2>
            <p className="section-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={`Close ${mode} profile form`}>×</button>
        </div>

        <div className="profile-auto-note">
          <strong>{mode === 'create' ? 'Auto setup' : 'Editing profile'}</strong>
          <span>{mode === 'create' ? 'Profile ID will be generated on save. Stage 1 is created automatically as Script.' : 'Changes are only saved after you click Save changes. Cancelling keeps the existing profile unchanged.'}</span>
        </div>

        <div className="profile-form-section">
          <div>
            <h3>Basic information</h3>
            <p>Name this profile and connect it to the Gemini Gem URL.</p>
          </div>
          <div className="profile-form-grid">
            <div className="field">
              <label htmlFor={`${prefix}-profile-name`}>Profile name</label>
              <input id={`${prefix}-profile-name`} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="VD: BTV Bóng Cháy" autoFocus />
              {validation.fields.name ? <div className="field-error">{validation.fields.name}</div> : null}
            </div>
            <div className="field profile-field-wide">
              <label htmlFor={`${prefix}-profile-url`}>Gem URL</label>
              <input id={`${prefix}-profile-url`} value={draft.baseUrl} onChange={(event) => onChange({ ...draft, baseUrl: event.target.value })} placeholder="https://gemini.google.com/gem/..." />
              {validation.fields.baseUrl ? <div className="field-error">{validation.fields.baseUrl}</div> : null}
            </div>
            <div className="field">
              <label htmlFor={`${prefix}-profile-gem-name`}>Expected Gem name</label>
              <input id={`${prefix}-profile-gem-name`} value={draft.expectedGemName} onChange={(event) => onChange({ ...draft, expectedGemName: event.target.value })} placeholder="Optional" />
            </div>
            <div className="field">
              <label htmlFor={`${prefix}-profile-enabled`}>Availability</label>
              <select id={`${prefix}-profile-enabled`} value={draft.enabled ? 'enabled' : 'disabled'} onChange={(event) => onChange({ ...draft, enabled: event.target.value === 'enabled' })}>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="profile-form-section">
          <div>
            <h3>Output & export</h3>
            <p>Configure how output files are exported after the Script stage.</p>
          </div>
          <div className="profile-form-grid">
            <div className="field">
              <label htmlFor={`${prefix}-profile-export-mode`}>Export mode</label>
              <select id={`${prefix}-profile-export-mode`} value={draft.exportMode} onChange={(event) => onChange({ ...draft, exportMode: event.target.value as GemProfile['exportConfig']['mode'] })}>
                <option value="per_script">per_script</option>
                <option value="combined">combined</option>
                <option value="both">both</option>
              </select>
            </div>
            <div className="field profile-field-wide">
              <label htmlFor={`${prefix}-profile-filename-template`}>Filename template</label>
              <input id={`${prefix}-profile-filename-template`} value={draft.filenameTemplate} onChange={(event) => onChange({ ...draft, filenameTemplate: event.target.value })} />
            </div>
          </div>
        </div>

        <div className="profile-form-section">
          <div>
            <h3>Error policy</h3>
            <p>Choose retry behavior and whether failed stages stop a run.</p>
          </div>
          <div className="profile-form-grid">
            <div className="field">
              <label htmlFor={`${prefix}-profile-max-retries`}>Profile retry count</label>
              <input id={`${prefix}-profile-max-retries`} type="number" min={0} value={draft.maxProfileRetries} onChange={(event) => onChange({ ...draft, maxProfileRetries: Number(event.target.value) })} />
            </div>
            <div className="field">
              <label htmlFor={`${prefix}-profile-failure-policy`}>On stage failure</label>
              <select id={`${prefix}-profile-failure-policy`} value={draft.continueOnStageFailure ? 'continue' : 'stop'} onChange={(event) => onChange({ ...draft, continueOnStageFailure: event.target.value === 'continue' })}>
                <option value="stop">Stop run</option>
                <option value="continue">Continue run</option>
              </select>
            </div>
          </div>
        </div>

        {validation.global.length ? <div className="field-error">{validation.global.map((error) => <div key={error}>{error}</div>)}</div> : null}
        {message ? <div className="field-error">{message}</div> : null}

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="button" onClick={onSave}>{mode === 'create' ? 'Save Profile' : 'Save changes'}</button>
        </div>
      </section>
    </div>
  );
}

export function ProfilesPage() {
  const { profiles, selectedProfileId, loading, setSelectedProfileId, createAndPersistProfile, persistProfile, deleteProfileById } = useProfiles();

  const [message, setMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<ProfileDraft>(() => createInitialDraft());
  const [createMessage, setCreateMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<GemProfile | null>(null);
  const [editDraft, setEditDraft] = useState<ProfileDraft>(() => createInitialDraft());
  const [editMessage, setEditMessage] = useState('');

  const createProfile = useMemo(() => applyDraftToProfile(createDraft), [createDraft]);
  const createValidation = useMemo(() => validateProfile(createProfile), [createProfile]);
  const updatedEditProfile = useMemo(() => editProfile ? applyDraftToProfile(editDraft, editProfile) : null, [editDraft, editProfile]);
  const editValidation = useMemo(() => updatedEditProfile ? validateProfile(updatedEditProfile) : validateProfile(applyDraftToProfile(editDraft)), [editDraft, updatedEditProfile]);

  const openCreateModal = () => {
    setCreateDraft(createInitialDraft());
    setCreateMessage('');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateMessage('');
  };

  const openEditModal = (profile: GemProfile) => {
    setSelectedProfileId(profile.id);
    setEditProfile({ ...profile, stages: profile.stages.map((stage) => ({ ...stage })) });
    setEditDraft(draftFromProfile(profile));
    setEditMessage('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditMessage('');
  };

  const saveNewProfile = async () => {
    if (!createValidation.isValid) {
      setCreateMessage('Please fix validation errors before saving.');
      return;
    }
    const result = await createAndPersistProfile(createProfile);
    if (!result.ok) {
      setCreateMessage(result.message ?? 'Unable to create profile.');
      return;
    }
    setMessage(`Đã tạo profile: ${createProfile.name}.`);
    closeCreateModal();
  };

  const saveEditProfile = async () => {
    if (!updatedEditProfile) {
      setEditMessage('No profile selected.');
      return;
    }
    if (!editValidation.isValid) {
      setEditMessage('Please fix validation errors before saving.');
      return;
    }
    const result = await persistProfile(updatedEditProfile);
    if (!result.ok) {
      setEditMessage(result.message ?? 'Unable to update profile.');
      return;
    }
    setMessage(`Đã cập nhật profile: ${updatedEditProfile.name}.`);
    closeEditModal();
  };

  const deleteProfile = async (profileId: string) => {
    await deleteProfileById(profileId);
    setMessage('Đã xóa profile.');
  };

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading profiles...</h2>
      </section>
    );
  }

  return (
    <>
      <div className="split-grid profiles-layout">
        <section className="panel card section-stack config-list-panel">
          <div className="section-toolbar">
            <div>
              <h2 className="section-title">Profiles</h2>
              <p className="section-subtitle">Manage Gemini profiles in the same table workflow as Google Sheets.</p>
            </div>
            <div className="action-row">
              {message ? <span className="badge">{message}</span> : null}
              <button className="button" type="button" onClick={openCreateModal}>New Profile</button>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>Chưa có profile nào</h3>
              <p>Bấm New Profile để tạo Gemini profile đầu tiên.</p>
            </div>
          ) : (
            <div className="sheet-config-table-wrap">
              <table className="data-table sheet-config-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Profile name</th>
                    <th>Gem URL</th>
                    <th>Gem Name</th>
                    <th>Stages</th>
                    <th>Export Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, index) => (
                    <tr key={profile.id} className={selectedProfileId === profile.id ? 'selected-row' : ''}>
                      <td>{index + 1}</td>
                      <td><strong>{profile.name || '(No name)'}</strong></td>
                      <td><span className="table-ellipsis" title={profile.baseUrl}>{profile.baseUrl || 'No Gem URL'}</span></td>
                      <td>{profile.expectedGemName || 'Any Gem'}</td>
                      <td>{profile.stages.length} stage{profile.stages.length === 1 ? '' : 's'}</td>
                      <td>{profile.exportConfig.mode}</td>
                      <td>{profile.enabled ? <span className="status-badge success">Enabled</span> : <span className="status-badge pending">Disabled</span>}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="button secondary" onClick={(event) => { event.stopPropagation(); openEditModal(profile); }}>Edit</button>
                          <button type="button" className="button secondary" onClick={() => void deleteProfile(profile.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isCreateModalOpen ? (
        <ProfileModal
          mode="create"
          draft={createDraft}
          validation={createValidation}
          message={createMessage}
          onChange={setCreateDraft}
          onClose={closeCreateModal}
          onSave={() => void saveNewProfile()}
        />
      ) : null}

      {isEditModalOpen ? (
        <ProfileModal
          mode="edit"
          draft={editDraft}
          validation={editValidation}
          message={editMessage}
          onChange={setEditDraft}
          onClose={closeEditModal}
          onSave={() => void saveEditProfile()}
        />
      ) : null}
    </>
  );
}
