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
    extractingYoutubeScripts,
    sheetImportForm,
    sheetConfigs,
    selectedSheetConfigId,
    validation,
    setSelectedBatchId,
    setSelectedScriptId,
    setBatchName,
    updateSheetImportForm,
    saveSheetImportConfig,
    selectSheetConfig,
    translateVideoTitlesToVietnamese,
    extractYoutubeScripts,
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
    <div className="section-stack scripts-page-layout">
      <section className="panel card section-stack">
        <div className="section-toolbar">
          <div>
            <h2 className="section-title">Batch manager</h2>
            <p className="section-subtitle">Create and manage script groups by batch name.</p>
          </div>
          <div className="action-row">
            <button className="button" type="button" onClick={() => void createBatch()}>New Batch</button>
            <button className="button secondary" type="button" onClick={() => void deleteBatch()} disabled={batches.length === 0}>Delete Batch</button>
          </div>
        </div>
        <div className="field narrow-field">
          <label htmlFor="batch-selector">Batch name</label>
          <select id="batch-selector" value={selectedBatchId} onChange={(event) => setSelectedBatchId(event.target.value)}>
            {batches.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel card section-stack import-wizard-panel">
        <div>
          <h2 className="section-title">Import from Google Sheet</h2>
          <p className="section-subtitle">Select a saved Google Sheet config, map columns, choose a row range, then import or run sheet helpers.</p>
        </div>
        <div className="step-list import-step-list">
          <div className="step-item">
            <strong>Connect</strong>
            <span>Choose a saved config from Google Sheets, or use the current manual values.</span>
            <div className="field">
              <label htmlFor="sheet-config-selector">Google Sheet config</label>
              <select id="sheet-config-selector" value={selectedSheetConfigId} onChange={(event) => void selectSheetConfig(event.target.value)}>
                <option value="">Manual / unsaved config</option>
                {sheetConfigs.map((config) => (
                  <option key={config.id} value={config.id}>{config.name}</option>
                ))}
              </select>
            </div>
            <p className="helper-text">Thêm/sửa/xóa Google Sheet link, Sheet name, Apps Script Web App URL và API key ở tab Google Sheets.</p>
            <p className="helper-text strong">Sheet name đang dùng: <strong>{sheetImportForm.sheetName || 'Default first sheet'}</strong></p>
          </div>

          <div className="step-item">
            <strong>Map Columns</strong>
            <span>Map script fields, write-back output, translation, and YouTube extraction columns.</span>
            <div className="form-grid compact">
              <div className="field"><label htmlFor="sheet-title-column">Title column</label><input id="sheet-title-column" value={sheetImportForm.titleColumn} onChange={(event) => updateSheetImportForm({ titleColumn: event.target.value })} placeholder="A" /></div>
              <div className="field"><label htmlFor="sheet-content-column">Content column</label><input id="sheet-content-column" value={sheetImportForm.contentColumn} onChange={(event) => updateSheetImportForm({ contentColumn: event.target.value })} placeholder="C" /></div>
              <div className="field"><label htmlFor="sheet-video-title-column">Video title column</label><input id="sheet-video-title-column" value={sheetImportForm.videoTitleColumn} onChange={(event) => updateSheetImportForm({ videoTitleColumn: event.target.value })} placeholder="E" /></div>
              <div className="field"><label htmlFor="sheet-output-column">Output column</label><input id="sheet-output-column" value={sheetImportForm.outputColumn} onChange={(event) => updateSheetImportForm({ outputColumn: event.target.value })} placeholder="I" /></div>
              <div className="field"><label htmlFor="translation-source-column">Translate from</label><input id="translation-source-column" value={sheetImportForm.translationSourceColumn} onChange={(event) => updateSheetImportForm({ translationSourceColumn: event.target.value })} placeholder="E" /></div>
              <div className="field"><label htmlFor="translation-output-column">Translate output</label><input id="translation-output-column" value={sheetImportForm.translationOutputColumn} onChange={(event) => updateSheetImportForm({ translationOutputColumn: event.target.value })} placeholder="D" /></div>
              <div className="field"><label htmlFor="youtube-url-column">YouTube URL col</label><input id="youtube-url-column" value={sheetImportForm.youtubeUrlColumn} onChange={(event) => updateSheetImportForm({ youtubeUrlColumn: event.target.value })} placeholder="B" /></div>
              <div className="field"><label htmlFor="youtube-title-output-column">YT title output</label><input id="youtube-title-output-column" value={sheetImportForm.youtubeTitleOutputColumn} onChange={(event) => updateSheetImportForm({ youtubeTitleOutputColumn: event.target.value })} placeholder="E" /></div>
              <div className="field"><label htmlFor="youtube-transcript-output-column">Transcript output</label><input id="youtube-transcript-output-column" value={sheetImportForm.youtubeTranscriptOutputColumn} onChange={(event) => updateSheetImportForm({ youtubeTranscriptOutputColumn: event.target.value })} placeholder="H" /></div>
              <div className="field"><label htmlFor="youtube-transcript-ts-column">With timestamp</label><input id="youtube-transcript-ts-column" value={sheetImportForm.youtubeTranscriptTimestampColumn} onChange={(event) => updateSheetImportForm({ youtubeTranscriptTimestampColumn: event.target.value })} placeholder="I" /></div>
              <div className="field"><label htmlFor="youtube-preferred-language">Caption lang</label><input id="youtube-preferred-language" value={sheetImportForm.youtubePreferredLanguage} onChange={(event) => updateSheetImportForm({ youtubePreferredLanguage: event.target.value })} placeholder="ja" /></div>
            </div>
          </div>

          <div className="step-item">
            <strong>Range</strong>
            <span>Choose the sheet rows used by import, translation, and YouTube extraction.</span>
            <div className="form-grid two-column">
              <div className="field"><label htmlFor="sheet-start-row">Start row</label><input id="sheet-start-row" type="number" min={1} value={sheetImportForm.startRow} onChange={(event) => updateSheetImportForm({ startRow: event.target.value })} /></div>
              <div className="field"><label htmlFor="sheet-end-row">End row</label><input id="sheet-end-row" type="number" min={1} value={sheetImportForm.endRow} onChange={(event) => updateSheetImportForm({ endRow: event.target.value })} /></div>
            </div>
          </div>

          <div className="step-item">
            <strong>Import</strong>
            <span>Import rows into the current batch or save/run write-back helpers using the existing form values.</span>
            <div className="action-row align-center">
              <button className="button secondary" type="button" onClick={() => void saveSheetImportConfig()}>Save Config</button>
              <button className="button" type="button" disabled={importingSheet || !sheetImportForm.sheetUrl.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow || !sheetImportForm.titleColumn.trim() || !sheetImportForm.contentColumn.trim() || !sheetImportForm.videoTitleColumn.trim() || !sheetImportForm.outputColumn.trim()} onClick={() => void importFromGoogleSheet(sheetImportForm.sheetUrl, sheetImportForm.sheetName, Number(sheetImportForm.startRow), Number(sheetImportForm.endRow), sheetImportForm.titleColumn, sheetImportForm.contentColumn, sheetImportForm.videoTitleColumn, sheetImportForm.outputColumn)}>{importingSheet ? 'Importing...' : 'Import Sheet'}</button>
              <button className="button secondary" type="button" disabled={translatingSheetTitles || importingSheet || extractingYoutubeScripts || !sheetImportForm.translationSourceColumn.trim() || !sheetImportForm.translationOutputColumn.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow} onClick={() => void translateVideoTitlesToVietnamese()} title="Uses saved config: reads the configured translation source column by row range and writes Vietnamese title to the configured output column.">{translatingSheetTitles ? 'Translating titles...' : `Translate ${sheetImportForm.translationSourceColumn || 'E'} → ${sheetImportForm.translationOutputColumn || 'D'}`}</button>
              <button className="button secondary" type="button" disabled={extractingYoutubeScripts || importingSheet || translatingSheetTitles || !sheetImportForm.youtubeUrlColumn.trim() || !sheetImportForm.youtubeTitleOutputColumn.trim() || !sheetImportForm.youtubeTranscriptOutputColumn.trim() || !sheetImportForm.youtubeTranscriptTimestampColumn.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow} onClick={() => void extractYoutubeScripts()} title="Reads YouTube URLs from the configured column, extracts title/transcript in background, then writes back to configured output columns.">{extractingYoutubeScripts ? 'Extracting YouTube...' : `Extract YouTube ${sheetImportForm.youtubeUrlColumn || 'B'} → transcript`}</button>
            </div>
            <p className="helper-text">Import uses current form values. Write-back, title translation, and YouTube extraction save then use this config.</p>
            {importMessage ? <div className="badge">{importMessage}</div> : null}
          </div>
        </div>
      </section>

      <div className="split-grid scripts-editor-grid">
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
