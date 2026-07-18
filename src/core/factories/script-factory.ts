import type { Script, ScriptBatch } from '../models';
import { createId } from '../../shared/utils/id';
import { nowIso } from '../../shared/utils/time';

export function createDefaultScript(order = 0): Script {
  return {
    id: `S${String(order + 1).padStart(3, '0')}`,
    numberNo: `S${String(order + 1).padStart(3, '0')}`,
    title: `Script ${order + 1}`,
    content: '',
    enabled: true,
    order,
  };
}

export function createDefaultBatch(): ScriptBatch {
  const timestamp = nowIso();

  return {
    id: createId('batch'),
    name: 'Default Script Batch',
    scripts: [createDefaultScript(0)],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
