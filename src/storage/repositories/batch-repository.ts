import type { ScriptBatch } from '../../core/models';
import { createDefaultBatch } from '../../core/factories';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';

export class BatchRepository {
  async getAll(): Promise<ScriptBatch[]> {
    return chromeStorageArea.getItem<ScriptBatch[]>(STORAGE_KEYS.batches, []);
  }

  async getOrCreateDefault(): Promise<ScriptBatch> {
    const batches = await this.getAll();
    const first = batches[0];
    if (first) {
      return first;
    }

    const batch = createDefaultBatch();
    await this.save(batch);
    return batch;
  }

  async create(): Promise<ScriptBatch> {
    const batch = createDefaultBatch();
    await this.save(batch);
    return batch;
  }

  async getById(id: string): Promise<ScriptBatch | null> {
    const batches = await this.getAll();
    return batches.find((batch) => batch.id === id) ?? null;
  }

  async save(batch: ScriptBatch): Promise<void> {
    const batches = await this.getAll();
    const index = batches.findIndex((item) => item.id === batch.id);

    if (index >= 0) {
      batches[index] = batch;
    } else {
      batches.push(batch);
    }

    await chromeStorageArea.setItem(STORAGE_KEYS.batches, batches);
  }

  async delete(batchId: string): Promise<void> {
    const batches = await this.getAll();
    const next = batches.filter((batch) => batch.id !== batchId);
    await chromeStorageArea.setItem(STORAGE_KEYS.batches, next);
  }
}

export const batchRepository = new BatchRepository();
