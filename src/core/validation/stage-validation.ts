import type { Stage } from '../models';

export function validateStage(stage: Stage): string[] {
  const errors: string[] = [];

  if (!stage.id.trim()) {
    errors.push('Stage ID is required.');
  }

  if (!stage.name.trim()) {
    errors.push('Stage name is required.');
  }

  if (stage.type === 'fixed' && !stage.value.trim()) {
    errors.push('Fixed stage value is required.');
  }

  if (stage.timeoutMs <= 0) {
    errors.push('Timeout must be greater than 0.');
  }

  if (stage.stableSeconds < 0) {
    errors.push('Stable seconds cannot be negative.');
  }

  if (stage.retryCount < 0) {
    errors.push('Retry count cannot be negative.');
  }

  return errors;
}
