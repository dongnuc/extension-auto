import type { GemProfile } from '../models';
import { validateStage } from './stage-validation';

const GEMINI_HOST = 'https://gemini.google.com/';

export function validateGeminiBaseUrl(baseUrl: string): string | null {
  if (!baseUrl.trim()) {
    return 'Base URL is required.';
  }

  return baseUrl.startsWith(GEMINI_HOST)
    ? null
    : 'Base URL must start with https://gemini.google.com/';
}

export function validateProfile(profile: GemProfile) {
  const fields: Record<string, string> = {};
  const stageErrors: Record<string, string[]> = {};
  const global: string[] = [];

  if (!profile.id.trim()) {
    fields.id = 'Profile ID is required.';
  }

  if (!profile.name.trim()) {
    fields.name = 'Profile name is required.';
  }

  const baseUrlError = validateGeminiBaseUrl(profile.baseUrl);
  if (baseUrlError) {
    fields.baseUrl = baseUrlError;
  }

  if (profile.stages.length === 0) {
    global.push('At least one stage is required.');
  }

  const scriptStages = profile.stages.filter((stage) => stage.type === 'script');
  if (scriptStages.length === 0) {
    global.push('At least one script stage is required.');
  }

  const seenStageIds = new Set<string>();
  profile.stages.forEach((stage) => {
    const errors = validateStage(stage);
    if (seenStageIds.has(stage.id)) {
      errors.push('Stage ID must be unique.');
    }
    seenStageIds.add(stage.id);
    if (errors.length > 0) {
      stageErrors[stage.id] = errors;
    }
  });

  const outputExists = profile.stages.some((stage) => stage.id === profile.outputStageId);
  if (!outputExists) {
    fields.outputStageId = 'Output stage must reference an existing stage.';
  }

  if (!profile.exportConfig.filenameTemplate.trim()) {
    global.push('Filename template is required.');
  }

  return {
    fields,
    stageErrors,
    global,
    isValid: Object.keys(fields).length === 0 && Object.keys(stageErrors).length === 0 && global.length === 0,
  };
}
