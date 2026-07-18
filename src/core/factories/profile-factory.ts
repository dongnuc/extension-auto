import type { GemProfile } from '../models';
import { createDefaultStage } from './stage-factory';
import { createId } from '../../shared/utils/id';
import { nowIso } from '../../shared/utils/time';

export function createDefaultProfile(): GemProfile {
  const createdAt = nowIso();
  const initialStage = createDefaultStage(0, 'script');

  return {
    id: createId('profile'),
    name: 'New Gemini Profile',
    baseUrl: 'https://gemini.google.com/',
    expectedGemName: '',
    enabled: true,
    stages: [initialStage],
    outputStageId: initialStage.id,
    exportConfig: {
      mode: 'per_script',
      filenameTemplate: '{{scriptId}}.txt',
    },
    errorPolicy: {
      maxProfileRetries: 1,
      continueOnStageFailure: false,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export function cloneProfile(profile: GemProfile): GemProfile {
  const timestamp = nowIso();
  return {
    ...profile,
    id: createId('profile'),
    name: `${profile.name} Copy`,
    stages: profile.stages.map((stage, index) => ({
      ...stage,
      id: createId('stage'),
      order: index,
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createProfileSnapshot(profile: GemProfile): GemProfile {
  return structuredClone(profile);
}
