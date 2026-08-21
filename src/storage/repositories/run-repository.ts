import type { Run } from '../../core/models';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';

function normalizeRun(run: Run): Run {
  const normalizedJobs = run.jobs.map((job) => ({
    ...job,
    scriptTitle: job.scriptTitle ?? job.scriptId,
    scriptNumberNo: job.scriptNumberNo ?? null,
    profileName: job.profileName ?? run.profileSnapshot.name,
    inputField: job.inputField ?? 'content',
    tabId: job.tabId ?? null,
    url: job.url ?? null,
    currentTabUrl: job.currentTabUrl ?? job.url ?? null,
    startedAt: job.startedAt ?? null,
    submittedAt: job.submittedAt ?? null,
    output: job.output ?? '',
    errorMessage: job.errorMessage ?? null,
    source: job.source ?? null,
    sheetWriteback: {
      status: job.sheetWriteback?.status ?? (job.source ? 'ready' : 'idle'),
      targetRowNumber: job.sheetWriteback?.targetRowNumber ?? null,
      targetColumn: job.sheetWriteback?.targetColumn ?? job.source?.outputColumn ?? null,
      writtenAt: job.sheetWriteback?.writtenAt ?? null,
      message: job.sheetWriteback?.message ?? null,
    },
  }));

  return {
    ...run,
    jobs: normalizedJobs,
    progress: {
      totalJobs: run.progress?.totalJobs ?? normalizedJobs.length,
      completedJobs: run.progress?.completedJobs ?? normalizedJobs.filter((job) => ['completed', 'submitted'].includes(job.status)).length,
      failedJobs: run.progress?.failedJobs ?? normalizedJobs.filter((job) => job.status === 'failed').length,
      stoppedJobs: run.progress?.stoppedJobs ?? normalizedJobs.filter((job) => job.status === 'stopped').length,
      submittedJobs: run.progress?.submittedJobs ?? normalizedJobs.filter((job) => ['submitted', 'completed'].includes(job.status)).length,
      currentScriptId: run.progress?.currentScriptId ?? normalizedJobs[run.currentJobIndex]?.scriptId ?? null,
      currentStageId: run.progress?.currentStageId ?? null,
      currentStageName: run.progress?.currentStageName ?? null,
      currentStageIndex: run.progress?.currentStageIndex ?? null,
      retryMode: run.progress?.retryMode ?? 'none',
      currentStepLabel: run.progress?.currentStepLabel ?? 'Run restored from storage.',
      lastMessage: run.progress?.lastMessage ?? 'Run restored from storage.',
      lastError: run.progress?.lastError ?? null,
    },
  };
}

export class RunRepository {
  async getActiveRun(): Promise<Run | null> {
    const run = await chromeStorageArea.getItem<Run | null>(STORAGE_KEYS.activeRun, null);
    return run ? normalizeRun(run) : null;
  }

  async saveActiveRun(run: Run | null): Promise<void> {
    if (run === null) {
      await chromeStorageArea.removeItem(STORAGE_KEYS.activeRun);
      return;
    }

    await chromeStorageArea.setItem(STORAGE_KEYS.activeRun, normalizeRun(run));
  }

  async saveActiveRunIfCurrent(run: Run): Promise<boolean> {
    const current = await this.getActiveRun();
    if (!current || current.id !== run.id) {
      return false;
    }

    await this.saveActiveRun(run);
    return true;
  }

  async updateActiveRun(mutator: (run: Run) => Run | void): Promise<Run | null> {
    const run = await this.getActiveRun();
    if (!run) {
      return null;
    }

    const updated = normalizeRun(mutator(run) ?? run);
    await this.saveActiveRun(updated);
    return updated;
  }

  async getRunHistory(): Promise<Run[]> {
    const history = await chromeStorageArea.getItem<Run[]>(STORAGE_KEYS.runHistory, []);
    return history.map(normalizeRun);
  }

  async appendRunHistory(run: Run): Promise<void> {
    const history = await this.getRunHistory();
    history.unshift(normalizeRun(run));
    await chromeStorageArea.setItem(STORAGE_KEYS.runHistory, history);
  }

  async updateRunHistoryRun(runId: string, mutator: (run: Run) => Run | void): Promise<Run | null> {
    const history = await this.getRunHistory();
    const index = history.findIndex((run) => run.id === runId);
    if (index < 0) {
      return null;
    }

    const updated = normalizeRun(mutator(history[index]) ?? history[index]);
    history[index] = updated;
    await chromeStorageArea.setItem(STORAGE_KEYS.runHistory, history);
    return updated;
  }

  async restoreRunHistoryRun(run: Run): Promise<'restored' | 'already-exists'> {
    const history = await this.getRunHistory();
    if (history.some((item) => item.id === run.id)) {
      return 'already-exists';
    }

    history.unshift(normalizeRun(run));
    await chromeStorageArea.setItem(STORAGE_KEYS.runHistory, history);
    return 'restored';
  }

  async deleteRunHistoryRun(runId: string): Promise<void> {
    const history = await this.getRunHistory();
    const filtered = history.filter((run) => run.id !== runId);
    await chromeStorageArea.setItem(STORAGE_KEYS.runHistory, filtered);
  }
}

export const runRepository = new RunRepository();
