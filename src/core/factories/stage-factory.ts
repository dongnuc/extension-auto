import type { Stage, StageInputType } from '../models';
import { createId } from '../../shared/utils/id';

export function createDefaultStage(order = 0, type: StageInputType = 'script'): Stage {
  return {
    id: createId('stage'),
    name: type === 'script' ? `Script Stage ${order + 1}` : `Fixed Stage ${order + 1}`,
    type,
    value: type === 'fixed' ? '' : '',
    order,
    timeoutMs: 120000,
    stableSeconds: 5,
    retryCount: 1,
  };
}
