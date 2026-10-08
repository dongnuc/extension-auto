import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultBatch, createDefaultScript } from '../../core/factories';
import type { GoogleSheetConfig, Script, ScriptBatch } from '../../core/models';
import { validateScriptBatch } from '../../core/validation';
import { batchRepository, googleSheetConfigRepository } from '../../storage/repositories';
import { chromeStorageArea } from '../../storage/chrome-storage';
import { STORAGE_KEYS } from '../../storage/keys';
import { nowIso } from '../../shared/utils/time';
import { createId } from '../../shared/utils/id';
import { extractYoutubeScriptsFromSheet, translateSheetVideoTitlesToVietnamese } from '../utils/sheet-writeback';

const AUTOSAVE_DELAY_MS = 600;

interface AppsScriptCellResult {
  displayValue?: string;
}

interface AppsScriptRowResult {
  row: number;
  cells: Record<string, AppsScriptCellResult | undefined>;
}

interface AppsScriptResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: AppsScriptRowResult[];
}

export interface SheetImportFormState {
  sheetUrl: string;
  sheetName: string;
  startRow: string;
  endRow: string;
  titleColumn: string;
  contentColumn: string;
  videoTitleColumn: string;
  outputColumn: string;
  translationSourceColumn: string;
  translationOutputColumn: string;
  youtubeUrlColumn: string;
  youtubeTitleOutputColumn: string;
  youtubeTranscriptOutputColumn: string;
  youtubeTranscriptTimestampColumn: string;
  youtubePreferredLanguage: string;
  appScriptUrl: string;
  appScriptToken: string;
}
const DEFAULT_SHEET_IMPORT_FORM: SheetImportFormState = {
  sheetUrl: '',
  sheetName: '',
  startRow: '3',
  endRow: '11',
  titleColumn: 'A',
  contentColumn: 'C',
  videoTitleColumn: 'E',
  outputColumn: 'I',
  translationSourceColumn: 'E',
  translationOutputColumn: 'D',
  youtubeUrlColumn: 'B',
  youtubeTitleOutputColumn: 'E',
  youtubeTranscriptOutputColumn: 'H',
  youtubeTranscriptTimestampColumn: 'I',
  youtubePreferredLanguage: 'ja',
  appScriptUrl: '',
  appScriptToken: '',
};

function toColumnIndex(input: string): number | null {
  const normalized = input.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    return Number.isFinite(numeric) && numeric > 0 ? numeric - 1 : null;
  }
  if (!/^[A-Z]+$/.test(normalized)) {
    return null;
  }
  let result = 0;
  for (const char of normalized) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }
  return result - 1;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.replace(/\r/g, '').trim());
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentCell.replace(/\r/g, '').trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.replace(/\r/g, '').trim());
    rows.push(currentRow);
  }

  return rows;
}

function extractSpreadsheetId(sheetUrl: string): string | null {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

function extractSheetGid(sheetUrl: string): string | null {
  const match = sheetUrl.match(/[?#&]gid=([0-9]+)/);
  return match?.[1] ?? null;
}

async function resolveSheetGid(spreadsheetId: string, sheetName: string): Promise<string | null> {
  const normalizedSheetName = sheetName.trim();
  if (!normalizedSheetName) {
    return null;
  }

  const metadataUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
  const response = await fetch(metadataUrl);
  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  const tableMatches = Array.from(text.matchAll(/"table"\s*:\s*\{[^}]*"label"\s*:\s*"([^"]*)"[^}]*"url"\s*:\s*"([^"]*)"/g));
  for (const match of tableMatches) {
    const label = match[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)));
    const gidMatch = match[2].match(/[?&]gid=([0-9]+)/);
    if (label.trim().toLowerCase() === normalizedSheetName.toLowerCase() && gidMatch?.[1]) {
      return gidMatch[1];
    }
  }

  return null;
}

async function buildCsvUrl(spreadsheetId: string, sheetUrl: string, sheetName: string): Promise<string> {
  const normalizedSheetName = sheetName.trim();
  const explicitGid = extractSheetGid(sheetUrl);
  if (normalizedSheetName) {
    const params = new URLSearchParams({
      tqx: 'out:csv',
      sheet: normalizedSheetName,
    });
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
  }

  const gid = explicitGid ?? await resolveSheetGid(spreadsheetId, normalizedSheetName);
  const params = new URLSearchParams({ format: 'csv' });
  if (gid) {
    params.set('gid', gid);
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;
}

function normalizeSheetUrlToEdit(urlOrId: string): string {
  const spreadsheetId = extractSpreadsheetId(urlOrId) ?? (urlOrId.trim().match(/^[a-zA-Z0-9-_]+$/) ? urlOrId.trim() : null);
  return spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : urlOrId.trim();
}

async function callSheetAppsScript(url: string, payload: Record<string, unknown>): Promise<AppsScriptResponse> {
  const payloadWithSheet = { ...payload };
  if (typeof payloadWithSheet.sheetUrl === 'string') {
    payloadWithSheet.sheetUrl = normalizeSheetUrlToEdit(payloadWithSheet.sheetUrl);
  }

  const response = await fetch(url.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payloadWithSheet),
  });

  if (!response.ok) {
    throw new Error(`Apps Script request failed (${response.status}).`);
  }

  const data = await response.json() as AppsScriptResponse;
  if (!data.success) {
    throw new Error(`${data.error ?? 'APPS_SCRIPT_ERROR'}: ${data.message ?? 'Apps Script trả về lỗi.'}`);
  }
  return data;
}

function buildImportBatchName(existingNames: string[]): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${day}${month}`;
  const sameDay = existingNames.filter((name) => name.startsWith(`${prefix}-L`));
  return `${prefix}-L${sameDay.length + 1}`;
}

function normalizeImportFormState(value: Partial<SheetImportFormState> | null | undefined): SheetImportFormState {
  return {
    sheetUrl: typeof value?.sheetUrl === 'string' ? value.sheetUrl : DEFAULT_SHEET_IMPORT_FORM.sheetUrl,
    sheetName: typeof value?.sheetName === 'string' ? value.sheetName : DEFAULT_SHEET_IMPORT_FORM.sheetName,
    startRow: typeof value?.startRow === 'string' ? value.startRow : DEFAULT_SHEET_IMPORT_FORM.startRow,
    endRow: typeof value?.endRow === 'string' ? value.endRow : DEFAULT_SHEET_IMPORT_FORM.endRow,
    titleColumn: typeof value?.titleColumn === 'string' ? value.titleColumn : DEFAULT_SHEET_IMPORT_FORM.titleColumn,
    contentColumn: typeof value?.contentColumn === 'string' ? value.contentColumn : DEFAULT_SHEET_IMPORT_FORM.contentColumn,
    videoTitleColumn: typeof value?.videoTitleColumn === 'string' ? value.videoTitleColumn : DEFAULT_SHEET_IMPORT_FORM.videoTitleColumn,
    outputColumn: typeof value?.outputColumn === 'string' ? value.outputColumn : DEFAULT_SHEET_IMPORT_FORM.outputColumn,
    translationSourceColumn: typeof value?.translationSourceColumn === 'string' ? value.translationSourceColumn : DEFAULT_SHEET_IMPORT_FORM.translationSourceColumn,
    translationOutputColumn: typeof value?.translationOutputColumn === 'string' ? value.translationOutputColumn : DEFAULT_SHEET_IMPORT_FORM.translationOutputColumn,
    youtubeUrlColumn: typeof value?.youtubeUrlColumn === 'string' ? value.youtubeUrlColumn : DEFAULT_SHEET_IMPORT_FORM.youtubeUrlColumn,
    youtubeTitleOutputColumn: typeof value?.youtubeTitleOutputColumn === 'string' ? value.youtubeTitleOutputColumn : DEFAULT_SHEET_IMPORT_FORM.youtubeTitleOutputColumn,
    youtubeTranscriptOutputColumn: typeof value?.youtubeTranscriptOutputColumn === 'string' ? value.youtubeTranscriptOutputColumn : DEFAULT_SHEET_IMPORT_FORM.youtubeTranscriptOutputColumn,
    youtubeTranscriptTimestampColumn: typeof value?.youtubeTranscriptTimestampColumn === 'string' ? value.youtubeTranscriptTimestampColumn : DEFAULT_SHEET_IMPORT_FORM.youtubeTranscriptTimestampColumn,
    youtubePreferredLanguage: typeof value?.youtubePreferredLanguage === 'string' ? value.youtubePreferredLanguage : DEFAULT_SHEET_IMPORT_FORM.youtubePreferredLanguage,
    appScriptUrl: typeof value?.appScriptUrl === 'string' ? value.appScriptUrl : DEFAULT_SHEET_IMPORT_FORM.appScriptUrl,
    appScriptToken: typeof value?.appScriptToken === 'string' ? value.appScriptToken : DEFAULT_SHEET_IMPORT_FORM.appScriptToken,
  };
}

function buildRowNumbers(startRow: number, endRow: number): number[] {
  const step = startRow <= endRow ? 1 : -1;
  const rowNumbers: number[] = [];
  for (let rowNumber = startRow; step > 0 ? rowNumber <= endRow : rowNumber >= endRow; rowNumber += step) {
    rowNumbers.push(rowNumber);
  }
  return rowNumbers;
}

function normalizeImportColumn(input: string): string {
  return input.trim().toUpperCase();
}

interface ImportedSheetRowsResult {
  rows: Array<{ rowNumber: number; cells: Record<string, string>; hasAnyData: boolean }>;
  source: 'apps-script' | 'csv';
}

async function readRowsViaAppsScript(config: SheetImportFormState, spreadsheetId: string, startRow: number, endRow: number, columns: string[]): Promise<ImportedSheetRowsResult | null> {
  if (!config.appScriptUrl.trim() || !config.appScriptToken.trim()) {
    return null;
  }

  const response = await callSheetAppsScript(config.appScriptUrl, {
    token: config.appScriptToken,
    action: 'read_rows',
    startRow,
    endRow,
    columns,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetName: config.sheetName.trim(),
  });

  return {
    source: 'apps-script',
    rows: (response.data ?? []).map((item) => ({
      rowNumber: item.row,
      cells: Object.fromEntries(columns.map((column) => [column, (item.cells[column]?.displayValue ?? '').trim()])),
      hasAnyData: Object.values(item.cells).some((cell) => Boolean(cell?.displayValue?.trim())),
    })),
  };
}

async function readRowsViaCsv(spreadsheetId: string, sheetUrl: string, sheetName: string, startRow: number, endRow: number, columns: string[]): Promise<ImportedSheetRowsResult> {
  const csvUrl = await buildCsvUrl(spreadsheetId, sheetUrl, sheetName);
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Không thể đọc Google Sheet (${response.status}). Hãy kiểm tra quyền public/share của sheet.`);
  }

  const csvText = await response.text();
  if (csvText.trimStart().startsWith('<')) {
    throw new Error(sheetName.trim()
      ? `Không đọc được tab "${sheetName.trim()}". Hãy kiểm tra Sheet name đúng chính tả/dấu cách và sheet có quyền truy cập.`
      : 'Không đọc được CSV từ Google Sheet. Hãy kiểm tra quyền public/share của sheet.');
  }

  const rows = parseCsv(csvText);
  const rowNumbers = buildRowNumbers(startRow, endRow);
  const columnIndexes = new Map(columns.map((column) => [column, toColumnIndex(column)]));
  return {
    source: 'csv',
    rows: rowNumbers.map((rowNumber) => {
      const row = rows[rowNumber - 1] ?? [];
      return {
        rowNumber,
        cells: Object.fromEntries(columns.map((column) => {
          const index = columnIndexes.get(column);
          return [column, index === null || index === undefined ? '' : (row[index] ?? '').trim()];
        })),
        hasAnyData: row.some((cell) => cell.trim()),
      };
    }),
  };
}

export function useScriptBatch() {
  const [batches, setBatches] = useState<ScriptBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');
  const [importingSheet, setImportingSheet] = useState(false);
  const [translatingSheetTitles, setTranslatingSheetTitles] = useState(false);
  const [extractingYoutubeScripts, setExtractingYoutubeScripts] = useState(false);
  const [sheetImportForm, setSheetImportForm] = useState<SheetImportFormState>(DEFAULT_SHEET_IMPORT_FORM);
  const [sheetConfigs, setSheetConfigs] = useState<GoogleSheetConfig[]>([]);
  const [selectedSheetConfigId, setSelectedSheetConfigId] = useState<string>('');
  const saveTimerRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);

  const batch = useMemo(
    () => batches.find((item) => item.id === selectedBatchId) ?? batches[0] ?? null,
    [batches, selectedBatchId],
  );

  const selectedScript = useMemo(
    () => batch?.scripts.find((script) => script.id === selectedScriptId) ?? null,
    [batch, selectedScriptId],
  );

  const validation = useMemo(() => (batch ? validateScriptBatch(batch) : null), [batch]);

  useEffect(() => {
    const load = async () => {
      const [loadedBatches, savedSheetImportForm, savedSheetConfigs, savedSelectedSheetConfigId] = await Promise.all([
        batchRepository.getAll(),
        chromeStorageArea.getItem<SheetImportFormState>(STORAGE_KEYS.sheetImportForm, DEFAULT_SHEET_IMPORT_FORM),
        googleSheetConfigRepository.getAll(),
        googleSheetConfigRepository.getSelectedId(),
      ]);
      const nextBatches = loadedBatches.length > 0 ? loadedBatches : [await batchRepository.getOrCreateDefault()];
      setBatches(nextBatches);
      setSelectedBatchId(nextBatches[0]?.id ?? '');
      setSelectedScriptId(nextBatches[0]?.scripts[0]?.id ?? null);
      const normalizedConfigs = Array.isArray(savedSheetConfigs) ? savedSheetConfigs : [];
      setSheetConfigs(normalizedConfigs);
      setSelectedSheetConfigId(savedSelectedSheetConfigId && normalizedConfigs.some((config) => config.id === savedSelectedSheetConfigId) ? savedSelectedSheetConfigId : (normalizedConfigs[0]?.id ?? ''));
      setSheetImportForm(normalizeImportFormState(savedSheetImportForm));
      setLoading(false);
      hydratedRef.current = true;
    };

    void load();
  }, []);

  const persistBatch = useCallback(async (nextBatch: ScriptBatch) => {
    setSaveState('saving');
    await batchRepository.save(nextBatch);
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1200);
  }, []);

  const updateBatch = useCallback((updater: (current: ScriptBatch) => ScriptBatch) => {
    setBatches((current) => current.map((item) => item.id === selectedBatchId ? updater(item) : item));
  }, [selectedBatchId]);

  useEffect(() => {
    if (!batch || !hydratedRef.current) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistBatch(batch);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [batch, persistBatch]);

  const setBatchName = useCallback((name: string) => {
    updateBatch((current) => ({
      ...current,
      name,
      updatedAt: nowIso(),
    }));
  }, [updateBatch]);

  const createBatch = useCallback(async () => {
    const nextBatch = await batchRepository.create();
    setBatches((current) => [...current, nextBatch]);
    setSelectedBatchId(nextBatch.id);
    setSelectedScriptId(nextBatch.scripts[0]?.id ?? null);
  }, []);

  const deleteBatch = useCallback(async () => {
    if (!batch) {
      return;
    }

    const remaining = batches.filter((item) => item.id !== batch.id);
    if (remaining.length === 0) {
      const fallback = createDefaultBatch();
      await batchRepository.save(fallback);
      await batchRepository.delete(batch.id);
      setBatches([fallback]);
      setSelectedBatchId(fallback.id);
      setSelectedScriptId(fallback.scripts[0]?.id ?? null);
      return;
    }

    await batchRepository.delete(batch.id);
    setBatches(remaining);
    setSelectedBatchId(remaining[0]?.id ?? '');
    setSelectedScriptId(remaining[0]?.scripts[0]?.id ?? null);
  }, [batch, batches]);

  const addScript = useCallback(() => {
    updateBatch((current) => {
      const script = createDefaultScript(current.scripts.length);
      const nextBatch = {
        ...current,
        scripts: [...current.scripts, script],
        updatedAt: nowIso(),
      };
      setSelectedScriptId(script.id);
      return nextBatch;
    });
  }, [updateBatch]);

  const duplicateScript = useCallback(() => {
    if (!selectedScript) {
      return;
    }

    updateBatch((current) => {
      const duplicate: Script = {
        ...selectedScript,
        id: `${selectedScript.id}_copy`,
        numberNo: `${selectedScript.numberNo || selectedScript.id} Copy`,
        title: `${selectedScript.title} Copy`,
        order: selectedScript.order + 1,
      };

      const insertIndex = current.scripts.findIndex((script) => script.id === selectedScript.id) + 1;
      const nextScripts = [...current.scripts];
      nextScripts.splice(insertIndex, 0, duplicate);
      const normalizedScripts = nextScripts.map((script, order) => ({ ...script, order }));
      setSelectedScriptId(duplicate.id);
      return {
        ...current,
        scripts: normalizedScripts,
        updatedAt: nowIso(),
      };
    });
  }, [selectedScript, updateBatch]);

  const deleteScript = useCallback((scriptId?: string) => {
    const targetScriptId = scriptId ?? selectedScriptId;
    if (!targetScriptId) {
      return;
    }

    updateBatch((current) => {
      const remaining = current.scripts.filter((script) => script.id !== targetScriptId);
      const fallbackScript = remaining[0] ?? createDefaultScript(0);
      const normalizedScripts = (remaining.length > 0 ? remaining : [fallbackScript]).map((script, order) => ({
        ...script,
        order,
      }));
      setSelectedScriptId(normalizedScripts[0]?.id ?? null);
      return {
        ...current,
        scripts: normalizedScripts,
        updatedAt: nowIso(),
      };
    });
  }, [selectedScriptId, updateBatch]);

  const moveScript = useCallback((scriptId: string, direction: 'up' | 'down') => {
    updateBatch((current) => {
      const index = current.scripts.findIndex((script) => script.id === scriptId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.scripts.length) {
        return current;
      }

      const nextScripts = [...current.scripts];
      const [script] = nextScripts.splice(index, 1);
      nextScripts.splice(targetIndex, 0, script);

      return {
        ...current,
        scripts: nextScripts.map((item, order) => ({ ...item, order })),
        updatedAt: nowIso(),
      };
    });
  }, [updateBatch]);

  const updateScriptById = useCallback((scriptId: string, patch: Partial<Script>) => {
    updateBatch((current) => ({
      ...current,
      scripts: current.scripts.map((script) => {
        if (script.id !== scriptId) {
          return script;
        }
        const nextScript = { ...script, ...patch };
        if (typeof patch.title === 'string' && nextScript.source) {
          nextScript.source = { ...nextScript.source, videoTitle: patch.title };
        }
        return nextScript;
      }),
      updatedAt: nowIso(),
    }));
  }, [updateBatch]);

  const updateSelectedScript = useCallback((patch: Partial<Script>) => {
    if (!selectedScriptId) {
      return;
    }

    updateScriptById(selectedScriptId, patch);
  }, [selectedScriptId, updateScriptById]);

  const resetBatch = useCallback(() => {
    if (!selectedBatchId) {
      return;
    }
    const nextBatch = createDefaultBatch();
    nextBatch.id = selectedBatchId;
    setBatches((current) => current.map((item) => item.id === selectedBatchId ? nextBatch : item));
    setSelectedScriptId(nextBatch.scripts[0]?.id ?? null);
  }, [selectedBatchId]);

  const updateSheetImportForm = useCallback((patch: Partial<SheetImportFormState>) => {
    setSheetImportForm((current) => ({ ...current, ...patch }));
  }, []);

  const selectSheetConfig = useCallback(async (configId: string) => {
    const latestConfigs = await googleSheetConfigRepository.getAll();
    const config = latestConfigs.find((item) => item.id === configId);
    setSheetConfigs(latestConfigs);
    setSelectedSheetConfigId(configId);
    await googleSheetConfigRepository.setSelectedId(configId);
    if (!config) {
      return;
    }
    const nextForm = normalizeImportFormState({
      ...sheetImportForm,
      sheetUrl: config.sheetUrl,
      sheetName: config.sheetName,
      appScriptUrl: config.appScriptUrl,
      appScriptToken: config.appScriptToken,
    });
    setSheetImportForm(nextForm);
    await chromeStorageArea.setItem(STORAGE_KEYS.sheetImportForm, nextForm);
    setImportMessage(`Đã chọn Google Sheet config: ${config.name}.`);
  }, [sheetImportForm]);

  const saveSheetImportConfig = useCallback(async () => {
    const normalized = normalizeImportFormState(sheetImportForm);
    await chromeStorageArea.setItem(STORAGE_KEYS.sheetImportForm, normalized);
    setSheetImportForm(normalized);
    setImportMessage('Đã lưu cấu hình Google Sheet/App Script. Write-back sẽ dùng cấu hình đã lưu này.');
  }, [sheetImportForm]);

  const translateVideoTitlesToVietnamese = useCallback(async () => {
    setTranslatingSheetTitles(true);
    const normalized = normalizeImportFormState(sheetImportForm);
    setImportMessage(`Đang dịch từ cột ${normalized.translationSourceColumn || 'E'} sang tiếng Việt và ghi vào cột ${normalized.translationOutputColumn || 'D'}...`);
    try {
      await chromeStorageArea.setItem(STORAGE_KEYS.sheetImportForm, normalized);
      setSheetImportForm(normalized);
      const result = await translateSheetVideoTitlesToVietnamese(normalized.translationSourceColumn, normalized.translationOutputColumn);
      setImportMessage(result.message);
    } finally {
      setTranslatingSheetTitles(false);
    }
  }, [sheetImportForm]);

  const extractYoutubeScripts = useCallback(async () => {
    setExtractingYoutubeScripts(true);
    const normalized = normalizeImportFormState(sheetImportForm);
    setImportMessage(`Đang xử lý YouTube URLs từ cột ${normalized.youtubeUrlColumn || 'B'}...`);
    try {
      await chromeStorageArea.setItem(STORAGE_KEYS.sheetImportForm, normalized);
      setSheetImportForm(normalized);
      const result = await extractYoutubeScriptsFromSheet(normalized);
      setImportMessage(result.message);
    } finally {
      setExtractingYoutubeScripts(false);
    }
  }, [sheetImportForm]);

  const importFromGoogleSheet = useCallback(async (sheetUrl: string, sheetName: string, startRow: number, endRow: number, titleColumn: string, contentColumn: string, videoTitleColumn: string, outputColumn: string) => {
    try {
      setImportingSheet(true);
      setImportMessage('');

      if (!Number.isFinite(startRow) || !Number.isFinite(endRow) || startRow < 1 || endRow < 1) {
        setImportMessage('Start row và End row phải là số dòng hợp lệ.');
        return;
      }

      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        setImportMessage('Google Sheet link không hợp lệ.');
        return;
      }

      const normalizedTitleColumn = normalizeImportColumn(titleColumn);
      const normalizedContentColumn = normalizeImportColumn(contentColumn);
      const normalizedVideoTitleColumn = normalizeImportColumn(videoTitleColumn);
      const normalizedOutputColumn = normalizeImportColumn(outputColumn);
      const columns = Array.from(new Set([normalizedTitleColumn, normalizedContentColumn, normalizedVideoTitleColumn]));

      if (columns.some((column) => toColumnIndex(column) === null) || !normalizedOutputColumn) {
        setImportMessage('Không xác định được cột title/content/video/output. Có thể nhập dạng A, C, E, G hoặc số cột.');
        return;
      }

      let sheetRows = await readRowsViaAppsScript(normalizeImportFormState(sheetImportForm), spreadsheetId, startRow, endRow, columns);
      if (!sheetRows) {
        sheetRows = await readRowsViaCsv(spreadsheetId, sheetUrl, sheetName, startRow, endRow, columns);
      }

      const importedScripts: Script[] = [];
      let emptyContentRows = 0;
      const normalizedSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      for (const sheetRow of sheetRows.rows) {
        const rowNumber = sheetRow.rowNumber;
        const rawNumberNo = (sheetRow.cells[normalizedTitleColumn] ?? '').trim();
        const inferredNumberNo = rawNumberNo || null;
        const content = (sheetRow.cells[normalizedContentColumn] ?? '').trim();
        const videoTitle = (sheetRow.cells[normalizedVideoTitleColumn] ?? '').trim();
        if (!content && (inferredNumberNo || videoTitle || sheetRow.hasAnyData)) {
          emptyContentRows += 1;
        }
        if (!inferredNumberNo && !videoTitle && !content) {
          continue;
        }
        importedScripts.push({
          id: createId('script'),
          numberNo: inferredNumberNo || `Row ${rowNumber}`,
          title: videoTitle || inferredNumberNo || `Row ${rowNumber}`,
          content,
          enabled: true,
          order: importedScripts.length,
          source: {
            spreadsheetId,
            sheetUrl: normalizedSheetUrl,
            sheetName: sheetName.trim() || undefined,
            sourceRowNumber: rowNumber,
            titleColumn: normalizedTitleColumn,
            contentColumn: normalizedContentColumn,
            videoTitleColumn: normalizedVideoTitleColumn,
            outputColumn: normalizedOutputColumn,
            videoTitle,
          },
        });
      }

      if (importedScripts.length === 0) {
        setImportMessage('Không tìm thấy scripts hợp lệ trong khoảng dòng đã chọn.');
        return;
      }

      const timestamp = nowIso();
      const importedBatch: ScriptBatch = {
        id: createId('batch'),
        name: buildImportBatchName(batches.map((item) => item.name)),
        scripts: importedScripts,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await batchRepository.save(importedBatch);
      setBatches((current) => [...current, importedBatch]);
      setSelectedBatchId(importedBatch.id);
      setSelectedScriptId(importedBatch.scripts[0]?.id ?? null);
      setImportMessage(`Đã import ${importedScripts.length} script(s) từ Google Sheet${sheetName.trim() ? ` tab "${sheetName.trim()}"` : ''} vào batch ${importedBatch.name}. Nguồn đọc: ${sheetRows.source === 'apps-script' ? 'Apps Script read_rows (giữ đúng row thật)' : 'CSV fallback'}.${emptyContentRows > 0 ? ` Cảnh báo: ${emptyContentRows} row có content rỗng ở cột ${normalizedContentColumn}. Hãy kiểm tra Content column có đúng với sheet không.` : ''}`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Import Google Sheet thất bại.');
    } finally {
      setImportingSheet(false);
    }
  }, [batches]);

  return {
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
  };
}
