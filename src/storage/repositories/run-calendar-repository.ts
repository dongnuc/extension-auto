import type { GemProfile, Run, RunCalendarEntry, RunCalendarItem, RunJob, ScriptBatch } from '../../core/models';
import { createDefaultProfile } from '../../core/factories';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';
import { batchRepository } from './batch-repository';
import { runRepository } from './run-repository';

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

function isRecoverableStatus(status: string): RunJob['status'] {
  const allowedStatuses: RunJob['status'][] = ['pending', 'launching', 'submitted', 'running', 'completed', 'failed', 'skipped', 'stopped'];
  return allowedStatuses.includes(status as RunJob['status']) ? status as RunJob['status'] : 'completed';
}

function createRecoveredProfile(entry: RunCalendarEntry): GemProfile {
  const timestamp = new Date().toISOString();
  const profile = createDefaultProfile();
  return {
    ...profile,
    id: `recovered-profile-${entry.runId}`,
    name: entry.profileName || 'Recovered Profile',
    baseUrl: entry.items.find((item) => item.profileUrl)?.profileUrl ?? profile.baseUrl,
    createdAt: entry.createdAt || timestamp,
    updatedAt: entry.updatedAt || timestamp,
  };
}

function buildRecoveredRun(entry: RunCalendarEntry, batch: ScriptBatch | null): Run {
  const normalizedEntry = normalizeEntry(entry);
  const timestamp = new Date().toISOString();
  const jobs: RunJob[] = normalizedEntry.items.map((item, index) => {
    const script = batch?.scripts.find((batchScript) => batchScript.id === item.scriptId)
      ?? batch?.scripts.find((batchScript) => batchScript.title.trim().toLowerCase() === item.scriptTitle.trim().toLowerCase())
      ?? null;
    const source = script?.source
      ? {
          ...script.source,
          sourceRowNumber: item.rowNumber ?? script.source.sourceRowNumber,
        }
      : null;
    const status = isRecoverableStatus(item.status);
    return {
      scriptId: item.scriptId || `recovered-${normalizedEntry.runId}-${index}`,
      scriptTitle: item.scriptTitle || script?.title || 'Recovered Item',
      scriptNumberNo: item.numberNo || script?.numberNo || null,
      profileName: item.profileName || normalizedEntry.profileName,
      inputField: item.inputField ?? 'content',
      order: index,
      status,
      tabId: null,
      url: item.profileUrl,
      currentTabUrl: item.generatedUrl,
      startedAt: normalizedEntry.createdAt,
      submittedAt: ['submitted', 'completed'].includes(status) ? normalizedEntry.updatedAt : null,
      output: '',
      errorMessage: null,
      source,
      sheetWriteback: {
        status: source ? 'ready' : 'idle',
        targetRowNumber: item.rowNumber,
        targetColumn: source?.outputColumn ?? null,
        writtenAt: null,
        message: 'Recovered from Run Calendar snapshot. Detailed outputs were not stored in this snapshot.',
      },
    };
  });

  return {
    id: normalizedEntry.runId,
    batchId: normalizedEntry.batchId,
    profileSnapshot: createRecoveredProfile(normalizedEntry),
    selectedScriptIds: jobs.map((job) => job.scriptId),
    jobs,
    currentJobIndex: jobs.findIndex((job) => !['completed', 'failed', 'skipped', 'stopped'].includes(job.status)) >= 0
      ? jobs.findIndex((job) => !['completed', 'failed', 'skipped', 'stopped'].includes(job.status))
      : 0,
    status: normalizedEntry.status === 'completed' || normalizedEntry.status === 'failed' || normalizedEntry.status === 'stopped'
      ? normalizedEntry.status
      : 'completed',
    activeTabId: null,
    progress: {
      totalJobs: jobs.length,
      completedJobs: jobs.filter((job) => job.status === 'completed').length,
      failedJobs: jobs.filter((job) => job.status === 'failed').length,
      stoppedJobs: jobs.filter((job) => job.status === 'stopped').length,
      submittedJobs: jobs.filter((job) => ['submitted', 'completed'].includes(job.status)).length,
      currentScriptId: jobs[0]?.scriptId ?? null,
      currentStageId: null,
      currentStageName: null,
      currentStageIndex: null,
      retryMode: 'none',
      currentStepLabel: 'Recovered from Run Calendar.',
      lastMessage: 'Recovered from Run Calendar snapshot. Final outputs/stage results can only reappear if they still exist in storage.',
      lastError: null,
    },
    createdAt: normalizedEntry.createdAt || timestamp,
    updatedAt: normalizedEntry.updatedAt || timestamp,
  };
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

  async recoverToResults(runId: string): Promise<'restored' | 'already-exists' | 'not-found'> {
    const entry = (await this.getAll()).find((item) => item.runId === runId || item.runIds.includes(runId));
    if (!entry) {
      return 'not-found';
    }

    const batch = await batchRepository.getById(entry.batchId);
    return runRepository.restoreRunHistoryRun(buildRecoveredRun(entry, batch));
  }

  async delete(runId: string): Promise<void> {
    const entries = await this.getAll();
    await chromeStorageArea.setItem(STORAGE_KEYS.runCalendar, entries.filter((entry) => entry.runId !== runId));
  }
}

export const runCalendarRepository = new RunCalendarRepository();
