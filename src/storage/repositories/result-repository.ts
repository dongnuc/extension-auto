import type { JobResult, StageResult } from '../../core/models';
import { chromeStorageArea } from '../chrome-storage';
import { indexedDbClient, STORE_NAMES } from '../indexeddb';
import { STORAGE_KEYS } from '../keys';

export interface ResultIndexEntry {
  runId: string;
  jobResultIds: string[];
  stageResultIds: string[];
}

export class ResultRepository {
  async getIndex(): Promise<ResultIndexEntry[]> {
    return chromeStorageArea.getItem<ResultIndexEntry[]>(STORAGE_KEYS.resultIndex, []);
  }

  async saveStageResult(result: StageResult): Promise<void> {
    await indexedDbClient.put(STORE_NAMES.stageResults, result);
    await this.upsertIndex(result.runId, { stageResultId: result.id });
  }

  async saveJobResult(result: JobResult): Promise<void> {
    await indexedDbClient.put(STORE_NAMES.jobResults, result);
    await this.upsertIndex(result.runId, { jobResultId: result.id });
  }

  async getStageResult(id: string): Promise<StageResult | null> {
    return indexedDbClient.get<StageResult>(STORE_NAMES.stageResults, id);
  }

  async getJobResult(id: string): Promise<JobResult | null> {
    return indexedDbClient.get<JobResult>(STORE_NAMES.jobResults, id);
  }

  async getStageResultsByRun(runId: string): Promise<StageResult[]> {
    const entry = (await this.getIndex()).find((item) => item.runId === runId);
    if (!entry) {
      return [];
    }

    const results = await Promise.all(entry.stageResultIds.map((id) => this.getStageResult(id)));
    return results.filter((result): result is StageResult => Boolean(result));
  }

  async getJobResultsByRun(runId: string): Promise<JobResult[]> {
    const entry = (await this.getIndex()).find((item) => item.runId === runId);
    if (!entry) {
      return [];
    }

    const results = await Promise.all(entry.jobResultIds.map((id) => this.getJobResult(id)));
    return results.filter((result): result is JobResult => Boolean(result));
  }

  private async upsertIndex(runId: string, payload: { stageResultId?: string; jobResultId?: string }): Promise<void> {
    const index = await this.getIndex();
    const existing = index.find((entry) => entry.runId === runId);

    if (existing) {
      if (payload.stageResultId && !existing.stageResultIds.includes(payload.stageResultId)) {
        existing.stageResultIds.push(payload.stageResultId);
      }
      if (payload.jobResultId && !existing.jobResultIds.includes(payload.jobResultId)) {
        existing.jobResultIds.push(payload.jobResultId);
      }
    } else {
      index.push({
        runId,
        stageResultIds: payload.stageResultId ? [payload.stageResultId] : [],
        jobResultIds: payload.jobResultId ? [payload.jobResultId] : [],
      });
    }

    await chromeStorageArea.setItem(STORAGE_KEYS.resultIndex, index);
  }
}

export const resultRepository = new ResultRepository();
