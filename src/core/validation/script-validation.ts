import type { ScriptBatch } from '../models';

export function validateScriptBatch(batch: ScriptBatch) {
  const errors: string[] = [];
  const seenSourceRows = new Set<string>();

  if (!batch.name.trim()) {
    errors.push('Batch name is required.');
  }

  if (batch.scripts.length === 0) {
    errors.push('At least one script is required.');
  }

  batch.scripts.forEach((script, index) => {
    const normalizedTitle = script.title.trim();
    if (!normalizedTitle) {
      errors.push(`Script title is required for item ${index + 1}.`);
    }
    const sourceKey = script.source
      ? `${script.source.spreadsheetId}::${script.source.sheetName ?? ''}::${script.source.sourceRowNumber}`
      : '';
    if (sourceKey && seenSourceRows.has(sourceKey)) {
      errors.push(`Duplicate source row in batch: row ${script.source?.sourceRowNumber}`);
    }
    if (sourceKey) {
      seenSourceRows.add(sourceKey);
    }
  });

  return {
    errors,
    isValid: errors.length === 0,
  };
}
