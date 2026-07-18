import type { Run, RunCalendarEntry, RunCalendarItem, ScriptBatch } from '../../core/models';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';
import { batchRepository } from './batch-repository';

const MAX_CALENDAR_ENTRIES = 300;

function getCalendarDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function getGroupKey(entry: Pick<RunCalendarEntry, 'calendarDate' | 'batchId' | 'profileName'>): string {
  return `${entry.calendarDate}::${entry.batchId}::${entry.profileName.trim().toLowerCase()}`;
}

function normalizeEntry(entry: RunCalendarEntry): RunCalendarEntry {
  const createdAt = entry.createdAt ?? entry.updatedAt ?? new Date().toISOString();
  const runIds = entry.runIds?.length ? entry.runIds : [entry.runId].filter(Boolean);
  return {
    runId: entry.runId,
    runIds,
    calendarDate: entry.calendarDate ?? getCalendarDate(createdAt),
    profileName: entry.profileName ?? '',
    batchId: entry.batchId ?? '',
    status: entry.status ?? 'unknown',
    createdAt,
    updatedAt: entry.updatedAt ?? entry.createdAt ?? new Date().toISOString(),
    items: (entry.items ?? []).map((item) => ({
      scriptId: item.scriptId ?? '',
      scriptTitle: item.scriptTitle ?? '',
      numberNo: item.numberNo ?? '',
      profileName: item.profileName ?? entry.profileName ?? '',
      profileUrl: item.profileUrl ?? null,
      generatedUrl: item.generatedUrl ?? null,
      rowNumber: item.rowNumber ?? null,
      status: item.status ?? 'unknown',
      inputField: item.inputField ?? 'content',
    })),
  };
}

function buildCalendarItems(run: Run, batch: ScriptBatch | null): RunCalendarItem[] {
  return run.jobs.map((job) => {
    const script = batch?.scripts.find((item) => item.id === job.scriptId)
      ?? batch?.scripts.find((item) => item.title.trim().toLowerCase() === job.scriptTitle.trim().toLowerCase())
      ?? null;
    return {
      scriptId: job.scriptId,
      scriptTitle: job.scriptTitle,
      numberNo: job.scriptNumberNo ?? script?.numberNo ?? '',
      profileName: job.profileName || run.profileSnapshot.name,
      profileUrl: job.url ?? run.profileSnapshot.baseUrl ?? null,
      generatedUrl: job.currentTabUrl ?? null,
      rowNumber: job.source?.sourceRowNumber ?? script?.source?.sourceRowNumber ?? null,
      status: job.status,
      inputField: job.inputField ?? 'content',
    };
  });
}

export class RunCalendarRepository {
  async getAll(): Promise<RunCalendarEntry[]> {
    const entries = await chromeStorageArea.getItem<RunCalendarEntry[]>(STORAGE_KEYS.runCalendar, []);
    return entries.map(normalizeEntry).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async upsertFromRun(run: Run, batch: ScriptBatch | null): Promise<void> {
    const entries = await this.getAll();
    const nextEntry: RunCalendarEntry = normalizeEntry({
      runId: run.id,
      runIds: [run.id],
      calendarDate: getCalendarDate(run.createdAt),
      profileName: run.profileSnapshot.name,
      batchId: run.batchId,
      status: run.status,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      items: buildCalendarItems(run, batch),
    });

    const groupKey = getGroupKey(nextEntry);
    const existingGroup = entries.find((entry) => getGroupKey(entry) === groupKey);
    const mergedEntry = existingGroup
      ? normalizeEntry({
          ...existingGroup,
          runId: existingGroup.runId,
          runIds: Array.from(new Set([...existingGroup.runIds, run.id])),
          status: run.status,
          updatedAt: run.updatedAt,
          items: [
            ...existingGroup.items.filter((item) => !nextEntry.items.some((nextItem) => nextItem.scriptId === item.scriptId && nextItem.inputField === item.inputField)),
            ...nextEntry.items,
          ],
        })
      : nextEntry;

    const nextEntries = [mergedEntry, ...entries.filter((entry) => getGroupKey(entry) !== groupKey)]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_CALENDAR_ENTRIES);
    await chromeStorageArea.setItem(STORAGE_KEYS.runCalendar, nextEntries);
  }

  async upsertFromRunWithBatchLookup(run: Run): Promise<void> {
    const batch = await batchRepository.getById(run.batchId);
    await this.upsertFromRun(run, batch);
  }

  async delete(runId: string): Promise<void> {
    const entries = await this.getAll();
    await chromeStorageArea.setItem(STORAGE_KEYS.runCalendar, entries.filter((entry) => entry.runId !== runId));
  }
}

export const runCalendarRepository = new RunCalendarRepository();
