import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JobResult, Run, RunJob, StageResult } from '../../core/models';
import { runtimeMessageTypes, type CollectOutputMode } from '../../shared/messaging/contracts';
import { batchRepository, resultRepository, runCalendarRepository, runRepository } from '../../storage/repositories';
import { writeJobOutputToGoogleSheet } from '../utils/sheet-writeback';

interface ResultRunBundle {
  run: Run;
  jobResults: JobResult[];
  stageResults: StageResult[];
}

const RESULTS_REFRESH_MS = 1500;

export function useResults() {
  const [runs, setRuns] = useState<ResultRunBundle[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [selectedJobResultId, setSelectedJobResultId] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [writingBackJobIds, setWritingBackJobIds] = useState<string[]>([]);

  const loadResults = useCallback(async () => {
    const [history, activeRun] = await Promise.all([
      runRepository.getRunHistory(),
      runRepository.getActiveRun(),
    ]);

    const mergedHistory = activeRun
      ? history.some((run) => run.id === activeRun.id)
        ? history.map((run) => {
            if (run.id !== activeRun.id) {
              return run;
            }
            return new Date(activeRun.updatedAt).getTime() >= new Date(run.updatedAt).getTime()
              ? activeRun
              : run;
          })
        : [activeRun, ...history]
      : history;

    const batches = await batchRepository.getAll();
    const bundles = await Promise.all(
      mergedHistory.map(async (run) => {
        const [jobResults, stageResults] = await Promise.all([
          resultRepository.getJobResultsByRun(run.id),
          resultRepository.getStageResultsByRun(run.id),
        ]);
        const batch = batches.find((item) => item.id === run.batchId);
        const enrichedRun: Run = {
          ...run,
          jobs: run.jobs.map((job) => {
            const matchedScript = batch?.scripts.find((script) => script.id === job.scriptId)
              ?? batch?.scripts.find((script) => script.title.trim().toLowerCase() === job.scriptTitle.trim().toLowerCase())
              ?? null;
            const source = job.source ?? matchedScript?.source ?? null;
            return {
              ...job,
              scriptNumberNo: job.scriptNumberNo ?? matchedScript?.numberNo ?? null,
              source,
              sheetWriteback: {
                ...job.sheetWriteback,
                status: job.sheetWriteback.status === 'idle' && source ? 'ready' : job.sheetWriteback.status,
                targetColumn: job.sheetWriteback.targetColumn ?? source?.outputColumn ?? null,
              },
            };
          }),
        };

        return {
          run: enrichedRun,
          jobResults: jobResults.sort((left, right) => left.startedAt.localeCompare(right.startedAt)),
          stageResults: stageResults.sort((left, right) => left.startedAt.localeCompare(right.startedAt)),
        } satisfies ResultRunBundle;
      }),
    );

    setRuns(bundles);
    setSelectedRunId((currentRunId) => {
      const nextRunId = currentRunId && bundles.some((bundle) => bundle.run.id === currentRunId)
        ? currentRunId
        : (bundles[0]?.run.id ?? '');

      setSelectedJobResultId((currentJobResultId) => {
        const selectedBundle = bundles.find((bundle) => bundle.run.id === nextRunId) ?? bundles[0] ?? null;
        if (!selectedBundle) {
          return '';
        }

        return currentJobResultId && selectedBundle.jobResults.some((jobResult) => jobResult.id === currentJobResultId)
          ? currentJobResultId
          : (selectedBundle.jobResults[0]?.id ?? '');
      });

      return nextRunId;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadResults();
    };

    void load();
  }, [loadResults]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadResults();
    }, RESULTS_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadResults]);

  useEffect(() => {
    if (!copyMessage) {
      return;
    }

    const timerId = window.setTimeout(() => setCopyMessage(''), 3200);
    return () => window.clearTimeout(timerId);
  }, [copyMessage]);

  const selectedRunBundle = useMemo(
    () => runs.find((bundle) => bundle.run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  );

  const selectedJobResult = useMemo(() => {
    if (!selectedRunBundle) {
      return null;
    }

    return selectedRunBundle.jobResults.find((jobResult) => jobResult.id === selectedJobResultId)
      ?? selectedRunBundle.jobResults[0]
      ?? null;
  }, [selectedJobResultId, selectedRunBundle]);

  const selectedStageResults = useMemo(() => {
    if (!selectedRunBundle || !selectedJobResult) {
      return [];
    }

    const byId = new Map(selectedRunBundle.stageResults.map((stageResult) => [stageResult.id, stageResult]));
    return selectedJobResult.stageResultIds
      .map((id) => byId.get(id))
      .filter((stageResult): stageResult is StageResult => Boolean(stageResult));
  }, [selectedJobResult, selectedRunBundle]);

  const runtimeJobs = useMemo(() => selectedRunBundle?.run.jobs ?? [], [selectedRunBundle]);

  const canCollectScripts = useCallback((job: RunJob) => {
    return Boolean(job.tabId) && ['submitted', 'completed'].includes(job.status);
  }, []);

  const copyText = useCallback(async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(successMessage);
    } catch {
      setCopyMessage('Copy failed. Please copy manually.');
    }
  }, []);

  const updateRuntimeJob = useCallback(async (runId: string, scriptId: string, patch: Partial<RunJob>) => {
    const updatedRun = await runRepository.updateRunHistoryRun(runId, (run) => {
      const job = run.jobs.find((item) => item.scriptId === scriptId);
      if (!job) {
        return run;
      }
      Object.assign(job, patch);
      return run;
    });
    if (updatedRun) {
      await runCalendarRepository.upsertFromRunWithBatchLookup(updatedRun);
    }
    await loadResults();
  }, [loadResults]);

  const addRuntimeJob = useCallback(async (runId: string) => {
    await runRepository.updateRunHistoryRun(runId, (run) => {
      const order = run.jobs.length;
      run.jobs.push({
        scriptId: `manual-${Date.now()}`,
        scriptTitle: 'Manual Item',
        scriptNumberNo: null,
        profileName: run.profileSnapshot.name,
        inputField: 'content',
        order,
        status: 'pending',
        tabId: null,
        url: run.profileSnapshot.baseUrl,
        currentTabUrl: null,
        startedAt: null,
        submittedAt: null,
        output: '',
        errorMessage: null,
        source: null,
        sheetWriteback: {
          status: 'idle',
          targetRowNumber: null,
          targetColumn: null,
          writtenAt: null,
          message: null,
        },
      });
      run.progress.totalJobs = run.jobs.length;
      return run;
    });
    await loadResults();
  }, [loadResults]);

  const deleteRuntimeJob = useCallback(async (runId: string, scriptId: string) => {
    await runRepository.updateRunHistoryRun(runId, (run) => {
      run.jobs = run.jobs.filter((job) => job.scriptId !== scriptId).map((job, index) => ({ ...job, order: index }));
      run.progress.totalJobs = run.jobs.length;
      run.progress.submittedJobs = run.jobs.filter((job) => ['submitted', 'completed'].includes(job.status)).length;
      run.progress.failedJobs = run.jobs.filter((job) => job.status === 'failed').length;
      run.progress.stoppedJobs = run.jobs.filter((job) => job.status === 'stopped').length;
      return run;
    });
    await loadResults();
  }, [loadResults]);

  const deleteRun = useCallback(async (runId: string) => {
    const run = runs.find((bundle) => bundle.run.id === runId)?.run ?? null;
    if (run) {
      await runCalendarRepository.upsertFromRunWithBatchLookup(run);
    }
    await runRepository.deleteRunHistoryRun(runId);
    await loadResults();
  }, [loadResults, runs]);

  const collectScripts = useCallback(async (runId: string, scriptId: string, mode: CollectOutputMode = 'japanese-scripts') => {
    const response = await chrome.runtime.sendMessage({
      type: runtimeMessageTypes.collectJapaneseScripts,
      runId,
      scriptId,
      mode,
    }) as { ok: boolean; message?: string } | undefined;

    setCopyMessage(response?.message ?? 'Collect request finished.');
    await loadResults();
  }, [loadResults]);

  const relinkTabFromUrl = useCallback(async (runId: string, scriptId: string) => {
    const response = await chrome.runtime.sendMessage({
      type: runtimeMessageTypes.relinkRunJobTab,
      runId,
      scriptId,
    }) as { ok: boolean; message?: string } | undefined;

    setCopyMessage(response?.message ?? 'Relink request finished.');
    await loadResults();
  }, [loadResults]);

  const submitManualTextToJob = useCallback(async (runId: string, scriptId: string, text: string) => {
    const response = await chrome.runtime.sendMessage({
      type: runtimeMessageTypes.submitTextToRunJobTab,
      runId,
      scriptId,
      text,
    }) as { ok: boolean; message?: string } | undefined;

    setCopyMessage(response?.message ?? 'Manual submit request finished.');
    await loadResults();
  }, [loadResults]);

  const writeBackRuntimeJob = useCallback(async (runId: string, scriptId: string) => {
    const writeKey = `${runId}:${scriptId}`;
    const bundle = runs.find((item) => item.run.id === runId);
    const job = bundle?.run.jobs.find((item) => item.scriptId === scriptId);
    if (!job) {
      setCopyMessage('Không tìm thấy job để write-back.');
      return;
    }

    setWritingBackJobIds((current) => current.includes(writeKey) ? current : [...current, writeKey]);
    setCopyMessage(`Đang ghi output cho ${job.scriptTitle} vào Google Sheet...`);

    try {
      const result = await writeJobOutputToGoogleSheet(job);
      await runRepository.updateRunHistoryRun(runId, (run) => {
        const targetJob = run.jobs.find((item) => item.scriptId === scriptId);
        if (!targetJob) {
          return run;
        }
        targetJob.sheetWriteback = {
          status: result.status,
          targetRowNumber: result.targetRowNumber,
          targetColumn: result.targetColumn,
          writtenAt: result.status === 'written' ? new Date().toISOString() : targetJob.sheetWriteback.writtenAt,
          message: result.message,
        };
        return run;
      });
      setCopyMessage(result.message);
      await loadResults();
    } finally {
      setWritingBackJobIds((current) => current.filter((item) => item !== writeKey));
    }
  }, [loadResults, runs]);

  return {
    runs,
    loading,
    selectedRunBundle,
    selectedRunId,
    selectedJobResult,
    selectedJobResultId,
    selectedStageResults,
    runtimeJobs,
    copyMessage,
    writingBackJobIds,
    setSelectedRunId,
    setSelectedJobResultId,
    copyText,
    reloadResults: loadResults,
    updateRuntimeJob,
    addRuntimeJob,
    deleteRuntimeJob,
    deleteRun,
    collectScripts,
    relinkTabFromUrl,
    submitManualTextToJob,
    writeBackRuntimeJob,
    canCollectScripts,
  };
}
