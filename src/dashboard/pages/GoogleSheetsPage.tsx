import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [draft, setDraft] = useState<GoogleSheetConfig>(EMPTY_CONFIG);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedConfig = useMemo(() => configs.find((config) => config.id === selectedId) ?? null, [configs, selectedId]);

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
    setDraft(loadedConfigs.find((config) => config.id === nextSelectedId) ?? EMPTY_CONFIG);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const selectConfig = useCallback(async (configId: string) => {
    const config = configs.find((item) => item.id === configId) ?? null;
    setSelectedId(configId);
    setDraft(config ?? EMPTY_CONFIG);
    await googleSheetConfigRepository.setSelectedId(configId);
  }, [configs]);

  const createConfig = useCallback(async () => {
    setSelectedId('');
    setDraft(EMPTY_CONFIG);
    await googleSheetConfigRepository.setSelectedId('');
    setMessage('Form đã được làm trống. Nhập thông tin rồi bấm Save config để thêm mới.');
  }, []);

  const saveConfig = useCallback(async () => {
    if (!draft.name.trim()) {
      setMessage('Vui lòng nhập tên config.');
      return;
    }
    if (!draft.sheetUrl.trim() || !draft.appScriptUrl.trim()) {
      setMessage('Vui lòng nhập Google Sheet link và Apps Script Web App URL.');
      return;
    }
    const saved = await googleSheetConfigRepository.save({
      ...draft,
      name: draft.name.trim(),
      sheetUrl: draft.sheetUrl.trim(),
      sheetName: draft.sheetName.trim(),
      appScriptUrl: draft.appScriptUrl.trim(),
      appScriptToken: draft.appScriptToken.trim(),
    });
    await loadConfigs();
    setSelectedId(saved.id);
    setDraft(saved);
    setMessage(`Đã lưu config: ${saved.name}.`);
  }, [draft, loadConfigs]);

  const deleteConfig = useCallback(async () => {
    if (!selectedId) {
      return;
    }
    await googleSheetConfigRepository.delete(selectedId);
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
      <section className="panel card" style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <h2 className="section-title">Google Sheets</h2>
            <p className="section-subtitle">Manage reusable Sheet/App Script configs.</p>
          </div>
          <button className="button" type="button" onClick={() => void createConfig()}>Add</button>
        </div>
        <div style={{ display: 'grid', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
          {configs.length === 0 ? (
            <div className="panel" style={{ padding: 14, color: '#9fb1cd' }}>Chưa có config nào. Bấm Add để tạo.</div>
          ) : configs.map((config) => (
            <button
              key={config.id}
              className={`panel ${selectedId === config.id ? 'selected' : ''}`}
              type="button"
              onClick={() => void selectConfig(config.id)}
              style={{ textAlign: 'left', padding: 14, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <strong style={{ fontSize: 14, color: '#e8f0ff' }}>{config.name || '(No name)'}</strong>
                {selectedId === config.id ? <span className="badge">Selected</span> : null}
              </div>
              <div style={{ color: '#9fb1cd', fontSize: 12, marginTop: 8, wordBreak: 'break-all' }}>
                Sheet: {config.sheetUrl || 'No Google Sheet link'}
              </div>
              <div style={{ color: '#9fb1cd', fontSize: 12, marginTop: 6 }}>
                Sheet name: {config.sheetName || 'Default first sheet'}
              </div>
              <div style={{ color: '#6f86aa', fontSize: 12, marginTop: 6, wordBreak: 'break-all' }}>
                Apps Script: {config.appScriptUrl || 'No Web App URL'}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel card" style={{ display: 'grid', gap: 14 }}>
        <div>
          <h2 className="section-title">Config detail</h2>
          <p className="section-subtitle">Scripts page will select and use configs from this list.</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="field">
            <label htmlFor="sheet-config-detail-name">Config name</label>
            <input id="sheet-config-detail-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="VD: Main production sheet" />
          </div>
          <div className="field">
            <label htmlFor="sheet-config-detail-url">Google Sheet link</label>
            <input id="sheet-config-detail-url" value={draft.sheetUrl} onChange={(event) => setDraft((current) => ({ ...current, sheetUrl: event.target.value }))} placeholder="https://docs.google.com/spreadsheets/d/..." />
          </div>
          <div className="field">
            <label htmlFor="sheet-config-detail-name-tab">Sheet name / tab name</label>
            <input id="sheet-config-detail-name-tab" value={draft.sheetName} onChange={(event) => setDraft((current) => ({ ...current, sheetName: event.target.value }))} placeholder="VD: Tháng 8, Sheet1, Mùa Mưa" />
          </div>
          <div className="field">
            <label htmlFor="sheet-config-detail-app-script">Apps Script Web App URL</label>
            <input id="sheet-config-detail-app-script" value={draft.appScriptUrl} onChange={(event) => setDraft((current) => ({ ...current, appScriptUrl: event.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" />
          </div>
          <div className="field">
            <label htmlFor="sheet-config-detail-token">API key / token</label>
            <input id="sheet-config-detail-token" type="password" value={draft.appScriptToken} onChange={(event) => setDraft((current) => ({ ...current, appScriptToken: event.target.value }))} placeholder="TOOL_API_TOKEN" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="button" type="button" onClick={() => void saveConfig()}>{selectedConfig ? 'Save changes' : 'Save config'}</button>
          <button className="button secondary" type="button" onClick={() => void deleteConfig()} disabled={!selectedId}>Delete</button>
          {message ? <span className="badge">{message}</span> : null}
        </div>
      </section>
    </div>
  );
}
