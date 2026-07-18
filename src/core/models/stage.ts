export type StageInputType = 'script' | 'fixed';

export interface Stage {
  id: string;
  name: string;
  type: StageInputType;
  value: string;
  order: number;
  timeoutMs: number;
  stableSeconds: number;
  retryCount: number;
}

export interface StageValidationError {
  field: keyof Stage | `stage:${string}`;
  message: string;
}
