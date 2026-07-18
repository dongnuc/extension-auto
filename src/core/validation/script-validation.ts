import type { ScriptBatch } from '../models';

export function validateScriptBatch(batch: ScriptBatch) {
  const errors: string[] = [];
  const seenTitles = new Set<string>();

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
    if (normalizedTitle && seenTitles.has(normalizedTitle.toLowerCase())) {
      errors.push(`Duplicate script title in batch: ${normalizedTitle}`);
    }
    if (normalizedTitle) {
      seenTitles.add(normalizedTitle.toLowerCase());
    }
  });

  return {
    errors,
    isValid: errors.length === 0,
  };
}
