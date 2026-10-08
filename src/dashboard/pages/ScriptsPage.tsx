import { ScriptEditor } from '../components/scripts/ScriptEditor';
import { ScriptList } from '../components/scripts/ScriptList';
import { SheetImportPanel } from '../components/scripts/SheetImportPanel';
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
    updateSheetImportForm,
    saveSheetImportConfig,
    selectSheetConfig,
    translateVideoTitlesToVietnamese,
    extractYoutubeScripts,
    importFromGoogleSheet,
    deleteScript,
    updateSelectedScript,
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
      <div className="scripts-batch-selector">
        <label htmlFor="scripts-batch-select">Batch</label>
        <select
          id="scripts-batch-select"
          value={selectedBatchId}
          onChange={(event) => setSelectedBatchId(event.target.value)}
        >
          {batches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.scripts.length} scripts)
            </option>
          ))}
        </select>
      </div>

      <div className="scripts-workspace-grid">
        <ScriptList
          scripts={batch.scripts}
          batchName={batch.name}
          selectedScriptId={selectedScriptId}
          onSelect={setSelectedScriptId}
          onDelete={deleteScript}
        />
        <ScriptEditor
          selectedScript={selectedScript}
          saveState={saveState}
          validation={validation}
          onUpdateScript={updateSelectedScript}
        />
        <SheetImportPanel
          importMessage={importMessage}
          importingSheet={importingSheet}
          translatingSheetTitles={translatingSheetTitles}
          extractingYoutubeScripts={extractingYoutubeScripts}
          sheetImportForm={sheetImportForm}
          sheetConfigs={sheetConfigs}
          selectedSheetConfigId={selectedSheetConfigId}
          updateSheetImportForm={updateSheetImportForm}
          saveSheetImportConfig={saveSheetImportConfig}
          selectSheetConfig={selectSheetConfig}
          translateVideoTitlesToVietnamese={translateVideoTitlesToVietnamese}
          extractYoutubeScripts={extractYoutubeScripts}
          importFromGoogleSheet={importFromGoogleSheet}
        />
      </div>
    </div>
  );
}
