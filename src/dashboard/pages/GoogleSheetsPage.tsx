import { useCallback, useEffect, useState } from 'react';
import type { GoogleSheetConfig } from '../../core/models';
import { googleSheetConfigRepository } from '../../storage/repositories';

const EMPTY_CONFIG: GoogleSheetConfig = {
  id: '',
  name: '',
  sheetUrl: '',
  sheetName: '',
  appScriptUrl: '',
  appScriptToken: '',
  updatedAt: '',
};

export function GoogleSheetsPage() {
  const [configs, setConfigs] = useState<GoogleSheetConfig[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<GoogleSheetConfig>(EMPTY_CONFIG);
  const [createMessage, setCreateMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<GoogleSheetConfig>(EMPTY_CONFIG);
  const [editMessage, setEditMessage] = useState('');

  const loadConfigs = useCallback(async () => {
    const [loadedConfigs, loadedSelectedId] = await Promise.all([
      googleSheetConfigRepository.getAll(),
      googleSheetConfigRepository.getSelectedId(),
    ]);
    const nextSelectedId = loadedSelectedId && loadedConfigs.some((config) => config.id === loadedSelectedId)
      ? loadedSelectedId
      : (loadedConfigs[0]?.id ?? '');
    setConfigs(loadedConfigs);
    setSelectedId(nextSelectedId);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const openEditModal = useCallback(async (config: GoogleSheetConfig) => {
    const nextDraft = { ...config };
    setSelectedId(config.id);
    setEditDraft(nextDraft);
    setEditMessage('');
    await googleSheetConfigRepository.setSelectedId(config.id);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditMessage('');
  }, []);

  const openCreateModal = useCallback(() => {
    setCreateDraft(EMPTY_CONFIG);
    setCreateMessage('');
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setCreateMessage('');
  }, []);

  const saveCreateConfig = useCallback(async () => {
    if (!createDraft.name.trim()) {
      setCreateMessage('Vui lòng nhập tên config.');
      return;
    }
    if (!createDraft.sheetUrl.trim() || !createDraft.appScriptUrl.trim()) {
      setCreateMessage('Vui lòng nhập Google Sheet link và Apps Script Web App URL.');
      return;
    }
    const saved = await googleSheetConfigRepository.save({
      ...createDraft,
      id: '',
      name: createDraft.name.trim(),
      sheetUrl: createDraft.sheetUrl.trim(),
      sheetName: createDraft.sheetName.trim(),
      appScriptUrl: createDraft.appScriptUrl.trim(),
      appScriptToken: createDraft.appScriptToken.trim(),
    });
    await googleSheetConfigRepository.setSelectedId(saved.id);
    await loadConfigs();
    setSelectedId(saved.id);
    setMessage(`Đã tạo config: ${saved.name}.`);
    closeCreateModal();
  }, [closeCreateModal, createDraft, loadConfigs]);

  const saveEditConfig = useCallback(async () => {
    if (!editDraft.name.trim()) {
      setEditMessage('Vui lòng nhập tên config.');
      return;
    }
    if (!editDraft.sheetUrl.trim() || !editDraft.appScriptUrl.trim()) {
      setEditMessage('Vui lòng nhập Google Sheet link và Apps Script Web App URL.');
      return;
    }
    const saved = await googleSheetConfigRepository.save({
      ...editDraft,
      name: editDraft.name.trim(),
      sheetUrl: editDraft.sheetUrl.trim(),
      sheetName: editDraft.sheetName.trim(),
      appScriptUrl: editDraft.appScriptUrl.trim(),
      appScriptToken: editDraft.appScriptToken.trim(),
    });
    await googleSheetConfigRepository.setSelectedId(saved.id);
    await loadConfigs();
    setSelectedId(saved.id);
    setMessage(`Đã cập nhật config: ${saved.name}.`);
    closeEditModal();
  }, [closeEditModal, editDraft, loadConfigs]);

  const deleteConfigById = useCallback(async (configId: string) => {
    await googleSheetConfigRepository.delete(configId);
    if (selectedId === configId) {
      await googleSheetConfigRepository.setSelectedId('');
    }
    await loadConfigs();
    setMessage('Đã xóa Google Sheet config.');
  }, [loadConfigs, selectedId]);

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading Google Sheet configs...</h2>
      </section>
    );
  }

  return (
    <> 
    <div className="split-grid google-sheets-layout">
      <section className="panel card section-stack config-list-panel">
        <div className="section-toolbar">
          <div>
            <h2 className="section-title">Google Sheets</h2>
            <p className="section-subtitle">Manage reusable Sheet/App Script configs.</p>
          </div>
          <div className="action-row">
            {message ? <span className="badge">{message}</span> : null}
            <button className="button" type="button" onClick={openCreateModal}>Add</button>
          </div>
        </div>
        {configs.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>Chưa có config nào</h3>
            <p>Bấm Add để tạo Google Sheet config đầu tiên.</p>
          </div>
        ) : (
          <div className="sheet-config-table-wrap">
            <table className="data-table sheet-config-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Config name</th>
                  <th>Sheet name</th>
                  <th>Google Sheet</th>
                  <th>Apps Script</th>
                  <th>Updated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config, index) => (
                  <tr key={config.id} className={selectedId === config.id ? 'selected-row' : ''}>
                    <td>{index + 1}</td>
                    <td><strong>{config.name || '(No name)'}</strong></td>
                    <td>{config.sheetName || 'Default first sheet'}</td>
                    <td><span className="table-ellipsis" title={config.sheetUrl}>{config.sheetUrl || 'No Google Sheet link'}</span></td>
                    <td><span className="table-ellipsis" title={config.appScriptUrl}>{config.appScriptUrl || 'No Web App URL'}</span></td>
                    <td>{config.updatedAt ? new Date(config.updatedAt).toLocaleString() : '—'}</td>
                    <td>{selectedId === config.id ? <span className="status-badge running">Selected</span> : <span className="status-badge pending">Saved</span>}</td>
                    <td>
                      <div className="action-row">
                        <button type="button" className="button secondary" onClick={(event) => { event.stopPropagation(); void openEditModal(config); }}>Edit</button>
                        <button type="button" className="button secondary" onClick={() => void deleteConfigById(config.id)}>Delete</button>
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
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-sheet-config-title" onClick={closeCreateModal}>
        <section className="panel card create-profile-modal" onClick={(event) => event.stopPropagation()}>
          <div className="section-toolbar align-start">
            <div>
              <h2 id="create-sheet-config-title" className="section-title">Add Google Sheet Config</h2>
              <p className="section-subtitle">Create a reusable Google Sheet and Apps Script connection.</p>
            </div>
            <button type="button" className="icon-button" onClick={closeCreateModal} aria-label="Close add Google Sheet config form">×</button>
          </div>

          <div className="profile-auto-note">
            <strong>New config</strong>
            <span>This config is only saved after you click <b>Save config</b>. Cancelling will keep the current selected config unchanged.</span>
          </div>

          <div className="profile-form-section">
            <div>
              <h3>Connect Sheet</h3>
              <p>Name this config and connect it to a Google Sheet URL and optional tab name.</p>
            </div>
            <div className="profile-form-grid">
              <div className="field">
                <label htmlFor="new-sheet-config-name">Config name</label>
                <input id="new-sheet-config-name" value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="VD: Main production sheet" autoFocus />
              </div>
              <div className="field profile-field-wide">
                <label htmlFor="new-sheet-config-url">Google Sheet link</label>
                <input id="new-sheet-config-url" value={createDraft.sheetUrl} onChange={(event) => setCreateDraft((current) => ({ ...current, sheetUrl: event.target.value }))} placeholder="https://docs.google.com/spreadsheets/d/..." />
              </div>
              <div className="field">
                <label htmlFor="new-sheet-config-tab">Sheet name / tab name</label>
                <input id="new-sheet-config-tab" value={createDraft.sheetName} onChange={(event) => setCreateDraft((current) => ({ ...current, sheetName: event.target.value }))} placeholder="VD: Tháng 8, Sheet1, Mùa Mưa" />
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div>
              <h3>Apps Script</h3>
              <p>Provide the Apps Script Web App endpoint and token for write-back/helper actions.</p>
            </div>
            <div className="profile-form-grid">
              <div className="field profile-field-wide">
                <label htmlFor="new-sheet-config-app-script">Apps Script Web App URL</label>
                <input id="new-sheet-config-app-script" value={createDraft.appScriptUrl} onChange={(event) => setCreateDraft((current) => ({ ...current, appScriptUrl: event.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" />
              </div>
              <div className="field profile-field-wide">
                <label htmlFor="new-sheet-config-token">API key / token</label>
                <input id="new-sheet-config-token" type="password" value={createDraft.appScriptToken} onChange={(event) => setCreateDraft((current) => ({ ...current, appScriptToken: event.target.value }))} placeholder="TOOL_API_TOKEN" />
              </div>
            </div>
          </div>

          {createMessage ? <div className="field-error">{createMessage}</div> : null}

          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={closeCreateModal}>Cancel</button>
            <button type="button" className="button" onClick={() => void saveCreateConfig()}>Save config</button>
          </div>
        </section>
      </div>
    ) : null}

    {isEditModalOpen ? (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-sheet-config-title" onClick={closeEditModal}>
        <section className="panel card create-profile-modal" onClick={(event) => event.stopPropagation()}>
          <div className="section-toolbar align-start">
            <div>
              <h2 id="edit-sheet-config-title" className="section-title">Edit Google Sheet Config</h2>
              <p className="section-subtitle">Update the selected Google Sheet and Apps Script connection.</p>
            </div>
            <button type="button" className="icon-button" onClick={closeEditModal} aria-label="Close edit Google Sheet config form">×</button>
          </div>

          <div className="profile-auto-note">
            <strong>Editing config</strong>
            <span>Changes are only saved after you click <b>Save changes</b>. Cancelling keeps the existing config unchanged.</span>
          </div>

          <div className="profile-form-section">
            <div>
              <h3>Connect Sheet</h3>
              <p>Edit the config name, Google Sheet URL, and optional tab name.</p>
            </div>
            <div className="profile-form-grid">
              <div className="field">
                <label htmlFor="edit-sheet-config-name">Config name</label>
                <input id="edit-sheet-config-name" value={editDraft.name} onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} placeholder="VD: Main production sheet" autoFocus />
              </div>
              <div className="field profile-field-wide">
                <label htmlFor="edit-sheet-config-url">Google Sheet link</label>
                <input id="edit-sheet-config-url" value={editDraft.sheetUrl} onChange={(event) => setEditDraft((current) => ({ ...current, sheetUrl: event.target.value }))} placeholder="https://docs.google.com/spreadsheets/d/..." />
              </div>
              <div className="field">
                <label htmlFor="edit-sheet-config-tab">Sheet name / tab name</label>
                <input id="edit-sheet-config-tab" value={editDraft.sheetName} onChange={(event) => setEditDraft((current) => ({ ...current, sheetName: event.target.value }))} placeholder="VD: Tháng 8, Sheet1, Mùa Mưa" />
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div>
              <h3>Apps Script</h3>
              <p>Edit the Apps Script Web App endpoint and token for write-back/helper actions.</p>
            </div>
            <div className="profile-form-grid">
              <div className="field profile-field-wide">
                <label htmlFor="edit-sheet-config-app-script">Apps Script Web App URL</label>
                <input id="edit-sheet-config-app-script" value={editDraft.appScriptUrl} onChange={(event) => setEditDraft((current) => ({ ...current, appScriptUrl: event.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" />
              </div>
              <div className="field profile-field-wide">
                <label htmlFor="edit-sheet-config-token">API key / token</label>
                <input id="edit-sheet-config-token" type="password" value={editDraft.appScriptToken} onChange={(event) => setEditDraft((current) => ({ ...current, appScriptToken: event.target.value }))} placeholder="TOOL_API_TOKEN" />
              </div>
            </div>
          </div>

          {editMessage ? <div className="field-error">{editMessage}</div> : null}

          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={closeEditModal}>Cancel</button>
            <button type="button" className="button" onClick={() => void saveEditConfig()}>Save changes</button>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
