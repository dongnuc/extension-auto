import type { GemProfile, ScriptBatch } from '../models';
import { validateProfile } from './profile-validation';
import { validateScriptBatch } from './script-validation';

export function validateRunConfiguration(profile: GemProfile | null, batch: ScriptBatch | null, selectedScriptIds: string[]) {
  const errors: string[] = [];

  if (!profile) {
    errors.push('A profile must be selected.');
  }

  if (!batch) {
    errors.push('A script batch is required.');
  }

  if (profile && !validateProfile(profile).isValid) {
    errors.push('Selected profile is invalid.');
  }

  if (batch && !validateScriptBatch(batch).isValid) {
    errors.push('Script batch is invalid.');
  }

  if (selectedScriptIds.length === 0) {
    errors.push('At least one script must be selected for a run.');
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}
