import type { Script, ScriptBatch, ScriptSourceMetadata } from '../../core/models';
import { createDefaultBatch } from '../../core/factories';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';
import { getConfiguredUserSupabaseClient, throwSupabaseError } from './supabase-repository-utils';

interface ScriptBatchRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ScriptRow {
  id: string;
  batch_id: string;
  number_no: string | null;
  title: string;
  content: string;
  enabled: boolean;
  order_index: number;
  source: ScriptSourceMetadata | null;
  updated_at?: string;
}

function fromRows(batch: ScriptBatchRow, scripts: ScriptRow[]): ScriptBatch {
  return {
    id: batch.id,
    name: batch.name,
    createdAt: batch.created_at,
    updatedAt: batch.updated_at,
    scripts: scripts
      .filter((script) => script.batch_id === batch.id)
      .sort((left, right) => left.order_index - right.order_index)
      .map((script): Script => ({
        id: script.id,
        numberNo: script.number_no ?? '',
        title: script.title,
        content: script.content,
        enabled: script.enabled,
        order: script.order_index,
        source: script.source ?? undefined,
      })),
  };
}

export class BatchRepository {
  async getAll(): Promise<ScriptBatch[]> {
    const client = await getConfiguredUserSupabaseClient();
    if (!client) {
      return chromeStorageArea.getItem<ScriptBatch[]>(STORAGE_KEYS.batches, []);
    }

    const [{ data: batches, error: batchError }, { data: scripts, error: scriptError }] = await Promise.all([
      client.from('script_batches').select('id, name, created_at, updated_at').order('updated_at', { ascending: false }),
      client.from('scripts').select('id, batch_id, number_no, title, content, enabled, order_index, source'),
    ]);
    throwSupabaseError(batchError);
    throwSupabaseError(scriptError);
    return ((batches ?? []) as ScriptBatchRow[]).map((batch) => fromRows(batch, (scripts ?? []) as ScriptRow[]));
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
    const client = await getConfiguredUserSupabaseClient();
    if (!client) {
      const batches = await this.getAll();
      const index = batches.findIndex((item) => item.id === batch.id);
      if (index >= 0) {
        batches[index] = batch;
      } else {
        batches.push(batch);
      }
      await chromeStorageArea.setItem(STORAGE_KEYS.batches, batches);
      return;
    }

    const { error: batchError } = await client.from('script_batches').upsert({
      id: batch.id,
      name: batch.name,
      created_at: batch.createdAt,
      updated_at: batch.updatedAt,
    });
    throwSupabaseError(batchError);

    const { error: deleteError } = await client.from('scripts').delete().eq('batch_id', batch.id);
    throwSupabaseError(deleteError);

    if (batch.scripts.length > 0) {
      const { error: scriptError } = await client.from('scripts').insert(batch.scripts.map((script) => ({
        id: script.id,
        batch_id: batch.id,
        number_no: script.numberNo,
        title: script.title,
        content: script.content,
        enabled: script.enabled,
        order_index: script.order,
        source: script.source ?? null,
        source_spreadsheet_id: script.source?.spreadsheetId ?? null,
        source_sheet_url: script.source?.sheetUrl ?? null,
        source_sheet_name: script.source?.sheetName ?? null,
        source_row_number: script.source?.sourceRowNumber ?? null,
        output_column: script.source?.outputColumn ?? null,
        updated_at: batch.updatedAt,
      })));
      throwSupabaseError(scriptError);
    }
  }

  async delete(batchId: string): Promise<void> {
    const client = await getConfiguredUserSupabaseClient();
    if (!client) {
      const batches = await this.getAll();
      const next = batches.filter((batch) => batch.id !== batchId);
      await chromeStorageArea.setItem(STORAGE_KEYS.batches, next);
      return;
    }

    const { error } = await client.from('script_batches').delete().eq('id', batchId);
    throwSupabaseError(error);
  }
}

export const batchRepository = new BatchRepository();
