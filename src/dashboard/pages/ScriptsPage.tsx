import { ScriptEditor } from '../components/scripts/ScriptEditor';
import { ScriptList } from '../components/scripts/ScriptList';
import { useScriptBatch } from '../hooks/useScriptBatch';

export function ScriptsPage() {
  const {
    batches,
    batch,
    selectedBatchId,
    selectedScript,
    selectedScriptId,
    loading,
    saveState,
    importMessage,
    importingSheet,
    translatingSheetTitles,
    sheetImportForm,
    validation,
    setSelectedBatchId,
    setSelectedScriptId,
    setBatchName,
    updateSheetImportForm,
    saveSheetImportConfig,
    translateVideoTitlesToVietnamese,
    createBatch,
    deleteBatch,
    importFromGoogleSheet,
    addScript,
    duplicateScript,
    deleteScript,
    moveScript,
    updateScriptById,
    updateSelectedScript,
    resetBatch,
  } = useScriptBatch();

  if (loading || !batch) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading script batch...</h2>
      </section>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel card" style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 className="section-title">Batch manager</h2>
            <p className="section-subtitle">Create and manage script groups by batch name.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button" type="button" onClick={() => void createBatch()}>New Batch</button>
            <button className="button secondary" type="button" onClick={() => void deleteBatch()} disabled={batches.length === 0}>Delete Batch</button>
          </div>
        </div>
        <div className="field" style={{ maxWidth: 420 }}>
          <label htmlFor="batch-selector">Batch name</label>
          <select id="batch-selector" value={selectedBatchId} onChange={(event) => setSelectedBatchId(event.target.value)}>
            {batches.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel card" style={{ display: 'grid', gap: 14 }}>
        <div>
          <h2 className="section-title">Import from Google Sheet</h2>
          <p className="section-subtitle">Configure Google Sheet link, title column, content column, and row range. Import still supports reverse order like 10 to 8.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) repeat(6, minmax(110px, 160px))', gap: 12, alignItems: 'end' }}>
          <div className="field">
            <label htmlFor="sheet-url">Google Sheet link</label>
            <input id="sheet-url" value={sheetImportForm.sheetUrl} onChange={(event) => updateSheetImportForm({ sheetUrl: event.target.value })} placeholder="https://docs.google.com/spreadsheets/d/..." />
          </div>
          <div className="field">
            <label htmlFor="sheet-title-column">Title column</label>
            <input id="sheet-title-column" value={sheetImportForm.titleColumn} onChange={(event) => updateSheetImportForm({ titleColumn: event.target.value })} placeholder="A" />
          </div>
          <div className="field">
            <label htmlFor="sheet-content-column">Content column</label>
            <input id="sheet-content-column" value={sheetImportForm.contentColumn} onChange={(event) => updateSheetImportForm({ contentColumn: event.target.value })} placeholder="H" />
          </div>
          <div className="field">
            <label htmlFor="sheet-video-title-column">Video title column</label>
            <input id="sheet-video-title-column" value={sheetImportForm.videoTitleColumn} onChange={(event) => updateSheetImportForm({ videoTitleColumn: event.target.value })} placeholder="E" />
          </div>
          <div className="field">
            <label htmlFor="sheet-output-column">Output column</label>
            <input id="sheet-output-column" value={sheetImportForm.outputColumn} onChange={(event) => updateSheetImportForm({ outputColumn: event.target.value })} placeholder="I" />
          </div>
          <div className="field">
            <label htmlFor="sheet-start-row">Start row</label>
            <input id="sheet-start-row" type="number" min={1} value={sheetImportForm.startRow} onChange={(event) => updateSheetImportForm({ startRow: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="sheet-end-row">End row</label>
            <input id="sheet-end-row" type="number" min={1} value={sheetImportForm.endRow} onChange={(event) => updateSheetImportForm({ endRow: event.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(220px, 420px) repeat(2, minmax(110px, 160px))', gap: 12, alignItems: 'end' }}>
          <div className="field">
            <label htmlFor="app-script-url">Apps Script Web App URL</label>
            <input id="app-script-url" value={sheetImportForm.appScriptUrl} onChange={(event) => updateSheetImportForm({ appScriptUrl: event.target.value })} placeholder="https://script.google.com/macros/s/.../exec" />
          </div>
          <div className="field">
            <label htmlFor="app-script-token">Apps Script API token</label>
            <input id="app-script-token" type="password" value={sheetImportForm.appScriptToken} onChange={(event) => updateSheetImportForm({ appScriptToken: event.target.value })} placeholder="TOOL_API_TOKEN" />
          </div>
          <div className="field">
            <label htmlFor="translation-source-column">Translate from</label>
            <input id="translation-source-column" value={sheetImportForm.translationSourceColumn} onChange={(event) => updateSheetImportForm({ translationSourceColumn: event.target.value })} placeholder="E" />
          </div>
          <div className="field">
            <label htmlFor="translation-output-column">Translate output</label>
            <input id="translation-output-column" value={sheetImportForm.translationOutputColumn} onChange={(event) => updateSheetImportForm({ translationOutputColumn: event.target.value })} placeholder="D" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="button secondary"
            type="button"
            onClick={() => void saveSheetImportConfig()}
          >
            Save Config
          </button>
          <button
            className="button"
            type="button"
            disabled={importingSheet || !sheetImportForm.sheetUrl.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow || !sheetImportForm.titleColumn.trim() || !sheetImportForm.contentColumn.trim() || !sheetImportForm.videoTitleColumn.trim() || !sheetImportForm.outputColumn.trim()}
            onClick={() => void importFromGoogleSheet(sheetImportForm.sheetUrl, Number(sheetImportForm.startRow), Number(sheetImportForm.endRow), sheetImportForm.titleColumn, sheetImportForm.contentColumn, sheetImportForm.videoTitleColumn, sheetImportForm.outputColumn)}
          >
            {importingSheet ? 'Importing...' : 'Import Sheet'}
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={translatingSheetTitles || importingSheet || !sheetImportForm.translationSourceColumn.trim() || !sheetImportForm.translationOutputColumn.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow}
            onClick={() => void translateVideoTitlesToVietnamese()}
            title="Uses saved config: reads the configured translation source column by row range and writes Vietnamese title to the configured output column."
          >
            {translatingSheetTitles ? 'Translating titles...' : `Translate ${sheetImportForm.translationSourceColumn || 'E'} → ${sheetImportForm.translationOutputColumn || 'D'}`}
          </button>
          <span style={{ color: '#9fb1cd', fontSize: 13 }}>Import uses the current form values. Write-back and title translation use the latest saved config.</span>
        </div>
        {importMessage ? <div className="badge">{importMessage}</div> : null}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
      <ScriptList
        scripts={batch.scripts}
        batchName={batch.name}
        selectedScriptId={selectedScriptId}
        onSelect={setSelectedScriptId}
        onAdd={addScript}
        onDuplicate={duplicateScript}
        onDelete={deleteScript}
        onToggleEnabled={(scriptId, enabled) => {
          setSelectedScriptId(scriptId);
          updateScriptById(scriptId, { enabled });
        }}
        onMove={moveScript}
      />
      <ScriptEditor
        batch={batch}
        selectedScript={selectedScript}
        saveState={saveState}
        validation={validation}
        onChangeBatchName={setBatchName}
        onUpdateScript={updateSelectedScript}
        onResetBatch={resetBatch}
      />
      </div>
    </div>
  );
}
