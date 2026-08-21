import type { RunJob } from '../../core/models';
import { chromeStorageArea } from '../../storage/chrome-storage';
import { STORAGE_KEYS } from '../../storage/keys';
import { runtimeMessageTypes, type YoutubeTranscriptPageData } from '../../shared/messaging/contracts';

interface SheetImportFormState {
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
  row?: number;
  updatedCells?: string[];
  conflicts?: Array<{ cell: string; displayValue: string }>;
}

export interface SheetWritebackResolution {
  status: 'written' | 'ambiguous' | 'missing-source' | 'write-failed';
  targetRowNumber: number | null;
  targetColumn: string | null;
  message: string;
}

export interface SheetTitleTranslationResult {
  success: boolean;
  processedRows: number;
  translatedRows: number;
  skippedRows: number;
  failedRows: number;
  message: string;
}

const DEFAULT_SHEET_IMPORT_FORM: SheetImportFormState = {
  sheetUrl: '',
  sheetName: '',
  startRow: '3',
  endRow: '11',
  titleColumn: 'A',
  contentColumn: 'H',
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

function normalizeColumn(input: string): string {
  const normalized = input.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) {
    throw new Error(`Cột không hợp lệ: ${input}`);
  }
  return normalized;
}

function normalizeForm(value: Partial<SheetImportFormState> | null | undefined): SheetImportFormState {
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

async function loadWritebackConfig(): Promise<SheetImportFormState> {
  const saved = await chromeStorageArea.getItem<SheetImportFormState>(STORAGE_KEYS.sheetImportForm, DEFAULT_SHEET_IMPORT_FORM);
  return normalizeForm(saved);
}

function normalizeSheetUrlToEdit(urlOrId: string | null | undefined): string | undefined {
  const text = String(urlOrId || '').trim();
  if (!text) {
    return undefined;
  }

  // 1. Try matching standard spreadsheets/d/<ID> URL format
  const match = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = match?.[1] || (text.match(/^[a-zA-Z0-9-_]+$/) ? text : null);

  if (spreadsheetId) {
    // Return standard, clean edit URL that SpreadsheetApp.openByUrl is guaranteed to accept
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  return text;
}

async function callAppsScript(url: string, payload: Record<string, unknown>): Promise<AppsScriptResponse> {
  const payloadWithSheet = { ...payload };
  if (['read_rows', 'update_row'].includes(String(payloadWithSheet.action ?? ''))) {
    const config = await loadWritebackConfig();
    if (!payloadWithSheet.sheetUrl && config.sheetUrl.trim()) {
      payloadWithSheet.sheetUrl = config.sheetUrl.trim();
    }
    if (!payloadWithSheet.sheetName && config.sheetName.trim()) {
      payloadWithSheet.sheetName = config.sheetName.trim();
    }
  }

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
    const details = data.conflicts?.length
      ? ` Conflicts: ${data.conflicts.map((item) => `${item.cell}=${item.displayValue}`).join(', ')}`
      : '';
    throw new Error(`${data.error ?? 'APPS_SCRIPT_ERROR'}: ${data.message ?? 'Apps Script trả về lỗi.'}${details}`);
  }

  return data;
}

function resolveVideoTitle(job: RunJob): string {
  return (job.source?.videoTitle || job.scriptTitle || '').trim();
}

function resolveColumns(config: SheetImportFormState): { videoTitleColumn: string; outputColumn: string; titleColumn: string } {
  return {
    videoTitleColumn: normalizeColumn(config.videoTitleColumn),
    outputColumn: normalizeColumn(config.outputColumn),
    titleColumn: normalizeColumn(config.titleColumn || 'A'),
  };
}

function resolveRowRange(config: SheetImportFormState): { startRow: number; endRow: number } {
  const start = Number(config.startRow);
  const end = Number(config.endRow);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 2 || end < 2) {
    throw new Error('Start row và End row phải là số hợp lệ và >= 2 theo Apps Script API.');
  }
  return {
    startRow: start,
    endRow: end,
  };
}

async function translateJapaneseToVietnamese(text: string): Promise<string> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'ja',
    tl: 'vi',
    dt: 't',
    q: text,
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Translate request failed (${response.status}).`);
  }

  const data = await response.json() as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Translate response không hợp lệ.');
  }

  return data[0]
    .map((part) => Array.isArray(part) && typeof part[0] === 'string' ? part[0] : '')
    .join('')
    .trim();
}

function idleTick(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function resolveTargetRow(job: RunJob, config: SheetImportFormState): Promise<{ rowNumber: number | null; message: string; status: SheetWritebackResolution['status']; outputColumn: string }> {
  const { videoTitleColumn, outputColumn, titleColumn } = resolveColumns(config);
  
  // Quyết định vùng quét dòng rộng hơn để bao phủ cả các dòng bị dịch chuyển xuống dưới
  const startRow = 3; // Luôn bắt đầu quét từ dòng dữ liệu đầu tiên (dòng 3)
  const endRow = Math.max(
    Number(config.endRow) || 100,
    (job.source?.sourceRowNumber ?? 0) + 150, // Cộng thêm biên an toàn 150 dòng đề phòng chèn dòng mới
    200 // Quét tối thiểu 200 dòng để luôn bao phủ dữ liệu lớn
  );

  // 1. Tìm kiếm bằng Mã Code hàng độc nhất (Cột A)
  const rowCode = (job.scriptNumberNo || '').trim();
  const searchColumn = (job.source?.titleColumn || titleColumn || 'A').toUpperCase();

  if (rowCode) {
    try {
      const readResponse = await callAppsScript(config.appScriptUrl, {
        token: config.appScriptToken,
        action: 'read_rows',
        startRow,
        endRow,
        columns: [searchColumn],
        sheetUrl: job.source?.sheetUrl || config.sheetUrl,
        sheetName: job.source?.sheetName || config.sheetName,
      });

      const matches = (readResponse.data ?? [])
        .map((item) => ({
          rowNumber: item.row,
          code: (item.cells[searchColumn]?.displayValue ?? '').trim(),
        }))
        .filter((item) => item.code === rowCode);

      if (matches.length === 1 && matches[0].rowNumber) {
        return {
          rowNumber: matches[0].rowNumber,
          message: `Đã xác định row ${matches[0].rowNumber} từ Row Code (${rowCode}).`,
          status: 'written',
          outputColumn,
        };
      }
    } catch (err) {
      console.warn('Truy vấn theo Row Code thất bại, chuyển sang chế độ dự phòng tìm theo Title:', err);
    }
  }

  // 2. Chế độ dự phòng (Fallback): Tìm theo tiêu đề video
  const videoTitle = resolveVideoTitle(job);
  if (!videoTitle) {
    return { rowNumber: null, message: 'Thiếu video title/Row Code để tìm row trong Google Sheet.', status: 'missing-source', outputColumn };
  }

  const readResponse = await callAppsScript(config.appScriptUrl, {
    token: config.appScriptToken,
    action: 'read_rows',
    startRow,
    endRow,
    columns: [videoTitleColumn],
    sheetUrl: job.source?.sheetUrl || config.sheetUrl,
    sheetName: job.source?.sheetName || config.sheetName,
  });

  const normalizedVideoTitle = videoTitle.toLowerCase();
  const matches = (readResponse.data ?? [])
    .map((item) => ({
      rowNumber: item.row,
      videoTitle: (item.cells[videoTitleColumn]?.displayValue ?? '').trim(),
    }))
    .filter((item) => item.videoTitle.toLowerCase() === normalizedVideoTitle);

  if (matches.length === 0) {
    return { rowNumber: null, message: `Không tìm thấy row có video title khớp: ${videoTitle}.`, status: 'missing-source', outputColumn };
  }

  if (matches.length > 1) {
    return { rowNumber: null, message: `Có ${matches.length} row cùng video title "${videoTitle}". Không ghi tự động để tránh nhầm dữ liệu.`, status: 'ambiguous', outputColumn };
  }

  return { rowNumber: matches[0].rowNumber, message: `Đã xác định row ${matches[0].rowNumber} từ video title.`, status: 'written', outputColumn };
}

export async function translateSheetVideoTitlesToVietnamese(sourceColumnInput = 'E', targetColumn = 'D'): Promise<SheetTitleTranslationResult> {
  const config = await loadWritebackConfig();
  if (!config.appScriptUrl.trim()) {
    return {
      success: false,
      processedRows: 0,
      translatedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      message: 'Thiếu Apps Script Web App URL. Hãy cấu hình và bấm Save Config trước.',
    };
  }
  if (!config.appScriptToken.trim()) {
    return {
      success: false,
      processedRows: 0,
      translatedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      message: 'Thiếu Apps Script API token. Hãy cấu hình và bấm Save Config trước.',
    };
  }

  try {
    const sourceColumn = normalizeColumn(sourceColumnInput || config.translationSourceColumn || config.videoTitleColumn);
    const destinationColumn = normalizeColumn(targetColumn || config.translationOutputColumn);
    const { startRow, endRow } = resolveRowRange(config);
    const readResponse = await callAppsScript(config.appScriptUrl, {
      token: config.appScriptToken,
      action: 'read_rows',
      startRow,
      endRow,
      columns: [sourceColumn, destinationColumn],
    });

    let processedRows = 0;
    let translatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;

    for (const row of readResponse.data ?? []) {
      processedRows += 1;
      const sourceTitle = (row.cells[sourceColumn]?.displayValue ?? '').trim();
      if (!sourceTitle) {
        skippedRows += 1;
        await idleTick();
        continue;
      }

      try {
        const translatedTitle = await translateJapaneseToVietnamese(sourceTitle);
        if (!translatedTitle) {
          skippedRows += 1;
          await idleTick();
          continue;
        }

        await callAppsScript(config.appScriptUrl, {
          token: config.appScriptToken,
          action: 'update_row',
          row: row.row,
          values: {
            [destinationColumn]: translatedTitle,
          },
        });
        translatedRows += 1;
      } catch {
        failedRows += 1;
      }

      await idleTick();
    }

    return {
      success: failedRows === 0,
      processedRows,
      translatedRows,
      skippedRows,
      failedRows,
      message: `Dịch title hoàn tất: ${translatedRows} row đã ghi vào cột ${destinationColumn}, ${skippedRows} row bỏ qua, ${failedRows} row lỗi.`,
    };
  } catch (error) {
    return {
      success: false,
      processedRows: 0,
      translatedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      message: error instanceof Error ? error.message : 'Dịch title sang tiếng Việt thất bại.',
    };
  }
}

export interface YoutubeSheetExtractionResult {
  success: boolean;
  processedRows: number;
  extractedRows: number;
  skippedRows: number;
  failedRows: number;
  message: string;
}

async function extractYoutubeTranscriptViaTab(url: string): Promise<YoutubeTranscriptPageData> {
  const response = await chrome.runtime.sendMessage({
    type: runtimeMessageTypes.extractYoutubeTranscriptByTab,
    url,
  }) as { ok?: boolean; data?: YoutubeTranscriptPageData; message?: string } | undefined;

  if (!response?.ok || !response.data) {
    throw new Error(response?.message || 'YOUTUBE_TAB_EXTRACTION_FAILED');
  }
  return response.data;
}

export async function extractYoutubeScriptsFromSheet(formOverride?: Partial<SheetImportFormState>): Promise<YoutubeSheetExtractionResult> {
  const config = normalizeForm(formOverride ?? await loadWritebackConfig());
  if (!config.appScriptUrl.trim()) {
    return { success: false, processedRows: 0, extractedRows: 0, skippedRows: 0, failedRows: 0, message: 'Thiếu Apps Script Web App URL. Hãy cấu hình và bấm Save Config trước.' };
  }
  if (!config.appScriptToken.trim()) {
    return { success: false, processedRows: 0, extractedRows: 0, skippedRows: 0, failedRows: 0, message: 'Thiếu Apps Script API token. Hãy cấu hình và bấm Save Config trước.' };
  }

  try {
    const youtubeUrlColumn = normalizeColumn(config.youtubeUrlColumn);
    const titleOutputColumn = normalizeColumn(config.youtubeTitleOutputColumn);
    const transcriptOutputColumn = normalizeColumn(config.youtubeTranscriptOutputColumn);
    const timestampOutputColumn = normalizeColumn(config.youtubeTranscriptTimestampColumn);
    const { startRow, endRow } = resolveRowRange(config);
    const readResponse = await callAppsScript(config.appScriptUrl, {
      token: config.appScriptToken,
      action: 'read_rows',
      startRow,
      endRow,
      columns: [youtubeUrlColumn],
    });

    let processedRows = 0;
    let extractedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;

    for (const row of readResponse.data ?? []) {
      processedRows += 1;
      const youtubeUrl = (row.cells[youtubeUrlColumn]?.displayValue ?? '').trim();
      if (!youtubeUrl) {
        skippedRows += 1;
        await idleTick();
        continue;
      }

      try {
        const transcript = await extractYoutubeTranscriptViaTab(youtubeUrl);
        await callAppsScript(config.appScriptUrl, {
          token: config.appScriptToken,
          action: 'update_row',
          row: row.row,
          values: {
            [titleOutputColumn]: transcript.title,
            [transcriptOutputColumn]: transcript.textNoTimestamp,
            [timestampOutputColumn]: transcript.textWithTimestamp,
          },
        });
        extractedRows += 1;
      } catch (error) {
        failedRows += 1;
        const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
        await callAppsScript(config.appScriptUrl, {
          token: config.appScriptToken,
          action: 'update_row',
          row: row.row,
          values: {
            [transcriptOutputColumn]: `ERROR|${message}`.slice(0, 450),
          },
        });
      }

      await idleTick();
    }

    return {
      success: failedRows === 0,
      processedRows,
      extractedRows,
      skippedRows,
      failedRows,
      message: `YouTube extraction hoàn tất: ${extractedRows} row đã ghi title/transcript, ${skippedRows} row bỏ qua, ${failedRows} row lỗi.`,
    };
  } catch (error) {
    return {
      success: false,
      processedRows: 0,
      extractedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      message: error instanceof Error ? error.message : 'YouTube extraction thất bại.',
    };
  }
}

export async function writeJobOutputToGoogleSheet(job: RunJob): Promise<SheetWritebackResolution> {
  const config = await loadWritebackConfig();
  if (!config.appScriptUrl.trim()) {
    return {
      status: 'write-failed',
      targetRowNumber: null,
      targetColumn: null,
      message: 'Thiếu Apps Script Web App URL. Hãy cấu hình trong Import from Google Sheet.',
    };
  }
  if (!config.appScriptToken.trim()) {
    return {
      status: 'write-failed',
      targetRowNumber: null,
      targetColumn: null,
      message: 'Thiếu Apps Script API token. Hãy cấu hình trong Import from Google Sheet.',
    };
  }

  try {
    const resolved = await resolveTargetRow(job, config);
    if (resolved.status !== 'written' || !resolved.rowNumber) {
      return {
        status: resolved.status,
        targetRowNumber: resolved.rowNumber,
        targetColumn: resolved.outputColumn,
        message: resolved.message,
      };
    }

        const updateResponse = await callAppsScript(config.appScriptUrl, {
      token: config.appScriptToken,
      action: 'update_row',
      row: resolved.rowNumber,
      values: {
        [resolved.outputColumn]: job.output,
      },
      expectedEmptyColumns: [resolved.outputColumn],
      sheetUrl: job.source?.sheetUrl || config.sheetUrl,
      sheetName: job.source?.sheetName || config.sheetName,
    });

    return {
      status: 'written',
      targetRowNumber: resolved.rowNumber,
      targetColumn: resolved.outputColumn,
      message: `Đã ghi output vào ${updateResponse.updatedCells?.join(', ') || `${resolved.outputColumn}${resolved.rowNumber}`}.`,
    };
  } catch (error) {
    return {
      status: 'write-failed',
      targetRowNumber: null,
      targetColumn: config.outputColumn || null,
      message: error instanceof Error ? error.message : 'Write-back qua Apps Script thất bại.',
    };
  }
}
