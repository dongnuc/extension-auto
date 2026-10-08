import type { GoogleSheetConfig } from '../../../core/models';
import type { SheetImportFormState } from '../../hooks/useScriptBatch';

interface SheetImportPanelProps {
  importMessage: string;
  importingSheet: boolean;
  translatingSheetTitles: boolean;
  extractingYoutubeScripts: boolean;
  sheetImportForm: SheetImportFormState;
  sheetConfigs: GoogleSheetConfig[];
  selectedSheetConfigId: string;
  updateSheetImportForm: (patch: Partial<SheetImportFormState>) => void;
  saveSheetImportConfig: () => void | Promise<void>;
  selectSheetConfig: (configId: string) => void | Promise<void>;
  translateVideoTitlesToVietnamese: () => void | Promise<void>;
  extractYoutubeScripts: () => void | Promise<void>;
  importFromGoogleSheet: (
    sheetUrl: string,
    sheetName: string,
    startRow: number,
    endRow: number,
    titleColumn: string,
    contentColumn: string,
    videoTitleColumn: string,
    outputColumn: string,
  ) => void | Promise<void>;
}

export function SheetImportPanel({
  importMessage,
  importingSheet,
  translatingSheetTitles,
  extractingYoutubeScripts,
  sheetImportForm,
  sheetConfigs,
  selectedSheetConfigId,
  updateSheetImportForm,
  saveSheetImportConfig,
  selectSheetConfig,
  translateVideoTitlesToVietnamese,
  extractYoutubeScripts,
  importFromGoogleSheet,
}: SheetImportPanelProps) {
  const importDisabled = importingSheet
    || !sheetImportForm.sheetUrl.trim()
    || !sheetImportForm.startRow
    || !sheetImportForm.endRow
    || !sheetImportForm.titleColumn.trim()
    || !sheetImportForm.contentColumn.trim()
    || !sheetImportForm.videoTitleColumn.trim()
    || !sheetImportForm.outputColumn.trim();

  return (
    <section className="panel card section-stack scripts-import-panel">
      <div>
        <h2 className="section-title">Import from Google Sheets</h2>
        <p className="section-subtitle">Import scripts, translations, and YouTube data.</p>
      </div>

      <div className="scripts-import-scroll">
        <div className="scripts-import-group">
          <div className="scripts-import-heading"><span>1</span><strong>Select config</strong></div>
          <div className="field">
            <label htmlFor="sheet-config-selector">Google Sheet config</label>
            <select id="sheet-config-selector" value={selectedSheetConfigId} onChange={(event) => void selectSheetConfig(event.target.value)}>
              <option value="">Manual / unsaved config</option>
              {sheetConfigs.map((config) => (
                <option key={config.id} value={config.id}>{config.name}</option>
              ))}
            </select>
          </div>
          <p className="helper-text">Sheet: <strong>{sheetImportForm.sheetName || 'Default first sheet'}</strong></p>
        </div>

        <div className="scripts-import-group">
          <div className="scripts-import-heading"><span>2</span><strong>Column mapping</strong></div>
          <div className="scripts-column-grid">
            <div className="field"><label htmlFor="sheet-title-column">Title column</label><input id="sheet-title-column" value={sheetImportForm.titleColumn} onChange={(event) => updateSheetImportForm({ titleColumn: event.target.value })} placeholder="A" /></div>
            <div className="field"><label htmlFor="sheet-content-column">Content column</label><input id="sheet-content-column" value={sheetImportForm.contentColumn} onChange={(event) => updateSheetImportForm({ contentColumn: event.target.value })} placeholder="C" /></div>
            <div className="field"><label htmlFor="sheet-video-title-column">Video title</label><input id="sheet-video-title-column" value={sheetImportForm.videoTitleColumn} onChange={(event) => updateSheetImportForm({ videoTitleColumn: event.target.value })} placeholder="E" /></div>
            <div className="field"><label htmlFor="sheet-output-column">Output</label><input id="sheet-output-column" value={sheetImportForm.outputColumn} onChange={(event) => updateSheetImportForm({ outputColumn: event.target.value })} placeholder="I" /></div>
            <div className="field"><label htmlFor="translation-source-column">Translate from</label><input id="translation-source-column" value={sheetImportForm.translationSourceColumn} onChange={(event) => updateSheetImportForm({ translationSourceColumn: event.target.value })} placeholder="E" /></div>
            <div className="field"><label htmlFor="translation-output-column">Translate output</label><input id="translation-output-column" value={sheetImportForm.translationOutputColumn} onChange={(event) => updateSheetImportForm({ translationOutputColumn: event.target.value })} placeholder="D" /></div>
            <div className="field"><label htmlFor="youtube-url-column">YouTube URL</label><input id="youtube-url-column" value={sheetImportForm.youtubeUrlColumn} onChange={(event) => updateSheetImportForm({ youtubeUrlColumn: event.target.value })} placeholder="B" /></div>
            <div className="field"><label htmlFor="youtube-title-output-column">YT title output</label><input id="youtube-title-output-column" value={sheetImportForm.youtubeTitleOutputColumn} onChange={(event) => updateSheetImportForm({ youtubeTitleOutputColumn: event.target.value })} placeholder="E" /></div>
            <div className="field"><label htmlFor="youtube-transcript-output-column">Transcript</label><input id="youtube-transcript-output-column" value={sheetImportForm.youtubeTranscriptOutputColumn} onChange={(event) => updateSheetImportForm({ youtubeTranscriptOutputColumn: event.target.value })} placeholder="H" /></div>
            <div className="field"><label htmlFor="youtube-transcript-ts-column">Timestamp</label><input id="youtube-transcript-ts-column" value={sheetImportForm.youtubeTranscriptTimestampColumn} onChange={(event) => updateSheetImportForm({ youtubeTranscriptTimestampColumn: event.target.value })} placeholder="I" /></div>
            <div className="field"><label htmlFor="youtube-preferred-language">Caption lang</label><input id="youtube-preferred-language" value={sheetImportForm.youtubePreferredLanguage} onChange={(event) => updateSheetImportForm({ youtubePreferredLanguage: event.target.value })} placeholder="ja" /></div>
          </div>
        </div>

        <div className="scripts-import-group">
          <div className="scripts-import-heading"><span>3</span><strong>Row range</strong></div>
          <div className="scripts-range-grid">
            <div className="field"><label htmlFor="sheet-start-row">Start row</label><input id="sheet-start-row" type="number" min={1} value={sheetImportForm.startRow} onChange={(event) => updateSheetImportForm({ startRow: event.target.value })} /></div>
            <div className="field"><label htmlFor="sheet-end-row">End row</label><input id="sheet-end-row" type="number" min={1} value={sheetImportForm.endRow} onChange={(event) => updateSheetImportForm({ endRow: event.target.value })} /></div>
          </div>
        </div>
      </div>

      <div className="scripts-import-actions">
        <button className="button secondary" type="button" onClick={() => void saveSheetImportConfig()}>Save Config</button>
        <button className="button" type="button" disabled={importDisabled} onClick={() => void importFromGoogleSheet(sheetImportForm.sheetUrl, sheetImportForm.sheetName, Number(sheetImportForm.startRow), Number(sheetImportForm.endRow), sheetImportForm.titleColumn, sheetImportForm.contentColumn, sheetImportForm.videoTitleColumn, sheetImportForm.outputColumn)}>{importingSheet ? 'Importing...' : 'Import Sheet'}</button>
        <button className="button secondary" type="button" disabled={translatingSheetTitles || importingSheet || extractingYoutubeScripts || !sheetImportForm.translationSourceColumn.trim() || !sheetImportForm.translationOutputColumn.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow} onClick={() => void translateVideoTitlesToVietnamese()}>{translatingSheetTitles ? 'Translating...' : `Translate ${sheetImportForm.translationSourceColumn || 'E'} → ${sheetImportForm.translationOutputColumn || 'D'}`}</button>
        <button className="button secondary" type="button" disabled={extractingYoutubeScripts || importingSheet || translatingSheetTitles || !sheetImportForm.youtubeUrlColumn.trim() || !sheetImportForm.youtubeTitleOutputColumn.trim() || !sheetImportForm.youtubeTranscriptOutputColumn.trim() || !sheetImportForm.youtubeTranscriptTimestampColumn.trim() || !sheetImportForm.startRow || !sheetImportForm.endRow} onClick={() => void extractYoutubeScripts()}>{extractingYoutubeScripts ? 'Extracting...' : 'Extract YouTube transcript'}</button>
      </div>
      {importMessage ? <div className="badge scripts-import-message">{importMessage}</div> : null}
    </section>
  );
}
