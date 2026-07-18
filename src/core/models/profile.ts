import type { Stage } from './stage';

export type ExportMode = 'per_script' | 'combined' | 'both';

export interface ExportConfig {
  mode: ExportMode;
  filenameTemplate: string;
}

export interface ErrorPolicy {
  maxProfileRetries: number;
  continueOnStageFailure: boolean;
}

export interface GemProfile {
  id: string;
  name: string;
  baseUrl: string;
  expectedGemName: string;
  enabled: boolean;
  stages: Stage[];
  outputStageId: string;
  exportConfig: ExportConfig;
  errorPolicy: ErrorPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileValidationErrors {
  fields: Partial<Record<'id' | 'name' | 'baseUrl' | 'expectedGemName' | 'outputStageId', string>>;
  stageErrors: Record<string, string[]>;
  global: string[];
}
