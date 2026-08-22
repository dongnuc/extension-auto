import type { Run, RunJob } from '../../core/models';
import { chromeStorageArea } from '../chrome-storage';
import { STORAGE_KEYS } from '../keys';
import { getConfiguredUserSupabaseClient, throwSupabaseError } from './supabase-repository-utils';

interface RunRow { id:string; batch_id:string; profile_snapshot: Run['profileSnapshot']; selected_script_ids:string[]; current_job_index:number; status:Run['status']; active_tab_id:number|null; progress:Run['progress']; created_at:string; updated_at:string; }
interface RunJobRow { run_id:string; script_id:string; script_title:string; script_number_no:string|null; profile_name:string; input_field:RunJob['inputField']; order_index:number; status:RunJob['status']; tab_id:number|null; url:string|null; current_tab_url:string|null; started_at:string|null; submitted_at:string|null; output:string; error_message:string|null; source:RunJob['source']; sheet_writeback:RunJob['sheetWriteback']; }

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

function fromRows(row: RunRow, jobs: RunJobRow[]): Run {
  return normalizeRun({
    id: row.id, batchId: row.batch_id, profileSnapshot: row.profile_snapshot, selectedScriptIds: row.selected_script_ids ?? [], currentJobIndex: row.current_job_index, status: row.status, activeTabId: row.active_tab_id, progress: row.progress, createdAt: row.created_at, updatedAt: row.updated_at,
    jobs: jobs.filter((job) => job.run_id === row.id).sort((a,b)=>a.order_index-b.order_index).map((job) => ({ scriptId: job.script_id, scriptTitle: job.script_title, scriptNumberNo: job.script_number_no, profileName: job.profile_name, inputField: job.input_field, order: job.order_index, status: job.status, tabId: job.tab_id, url: job.url, currentTabUrl: job.current_tab_url, startedAt: job.started_at, submittedAt: job.submitted_at, output: job.output, errorMessage: job.error_message, source: job.source, sheetWriteback: job.sheet_writeback })),
  });
}

export class RunRepository {
  async getActiveRun(): Promise<Run | null> { const run = await chromeStorageArea.getItem<Run | null>(STORAGE_KEYS.activeRun, null); return run ? normalizeRun(run) : null; }
  async saveActiveRun(run: Run | null): Promise<void> { if (run === null) { await chromeStorageArea.removeItem(STORAGE_KEYS.activeRun); return; } await chromeStorageArea.setItem(STORAGE_KEYS.activeRun, normalizeRun(run)); }
  async saveActiveRunIfCurrent(run: Run): Promise<boolean> { const current = await this.getActiveRun(); if (!current || current.id !== run.id) return false; await this.saveActiveRun(run); return true; }
  async updateActiveRun(mutator: (run: Run) => Run | void): Promise<Run | null> { const run = await this.getActiveRun(); if (!run) return null; const updated = normalizeRun(mutator(run) ?? run); await this.saveActiveRun(updated); return updated; }

  async getRunHistory(): Promise<Run[]> {
    const client = await getConfiguredUserSupabaseClient();
    if (!client) return (await chromeStorageArea.getItem<Run[]>(STORAGE_KEYS.runHistory, [])).map(normalizeRun);
    const [{ data: runs, error: runError }, { data: jobs, error: jobError }] = await Promise.all([client.from('runs').select('*').order('updated_at', { ascending: false }), client.from('run_jobs').select('*')]);
    throwSupabaseError(runError); throwSupabaseError(jobError);
    return ((runs ?? []) as RunRow[]).map((run) => fromRows(run, (jobs ?? []) as RunJobRow[]));
  }

  private async saveRunHistory(run: Run): Promise<void> {
    const client = await getConfiguredUserSupabaseClient();
    if (!client) { const history = await chromeStorageArea.getItem<Run[]>(STORAGE_KEYS.runHistory, []); const index = history.findIndex((item) => item.id === run.id); if (index >= 0) history[index] = normalizeRun(run); else history.unshift(normalizeRun(run)); await chromeStorageArea.setItem(STORAGE_KEYS.runHistory, history); return; }
    const normalized = normalizeRun(run);
    throwSupabaseError((await client.from('runs').upsert({ id: normalized.id, batch_id: normalized.batchId, profile_snapshot: normalized.profileSnapshot, selected_script_ids: normalized.selectedScriptIds, current_job_index: normalized.currentJobIndex, status: normalized.status, active_tab_id: normalized.activeTabId, progress: normalized.progress, created_at: normalized.createdAt, updated_at: normalized.updatedAt })).error);
    throwSupabaseError((await client.from('run_jobs').delete().eq('run_id', normalized.id)).error);
    if (normalized.jobs.length) throwSupabaseError((await client.from('run_jobs').insert(normalized.jobs.map((job) => ({ id: `${normalized.id}:${job.scriptId}`, run_id: normalized.id, script_id: job.scriptId, script_title: job.scriptTitle, script_number_no: job.scriptNumberNo, profile_name: job.profileName, input_field: job.inputField, order_index: job.order, status: job.status, tab_id: job.tabId, url: job.url, current_tab_url: job.currentTabUrl, started_at: job.startedAt, submitted_at: job.submittedAt, output: job.output, error_message: job.errorMessage, source: job.source, sheet_writeback: job.sheetWriteback })))).error);
  }
  async appendRunHistory(run: Run): Promise<void> { await this.saveRunHistory(run); }
  async updateRunHistoryRun(runId: string, mutator: (run: Run) => Run | void): Promise<Run | null> { const run = (await this.getRunHistory()).find((item) => item.id === runId); if (!run) return null; const updated = normalizeRun(mutator(run) ?? run); await this.saveRunHistory(updated); return updated; }
  async restoreRunHistoryRun(run: Run): Promise<'restored' | 'already-exists'> { if ((await this.getRunHistory()).some((item) => item.id === run.id)) return 'already-exists'; await this.saveRunHistory(run); return 'restored'; }
  async deleteRunHistoryRun(runId: string): Promise<void> { const client = await getConfiguredUserSupabaseClient(); if (!client) { const history = await this.getRunHistory(); await chromeStorageArea.setItem(STORAGE_KEYS.runHistory, history.filter((run) => run.id !== runId)); return; } throwSupabaseError((await client.from('runs').delete().eq('id', runId)).error); }
}

export const runRepository = new RunRepository();
