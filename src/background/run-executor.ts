import type { Run, ScriptBatch } from '../core/models';
import { batchRepository, runCalendarRepository, runRepository } from '../storage/repositories';
import {
  runtimeMessageTypes,
  type CollectJapaneseScriptsData,
  type CollectOutputMode,
  type MessageEnvelope,
  type PageStateData,
  type SubmitScriptData,
} from '../shared/messaging/contracts';
import { createId } from '../shared/utils/id';
import { nowIso } from '../shared/utils/time';

const CONTROL_POLL_MS = 500;
const TAB_LAUNCH_THROTTLE_MS = 500;
const activeExecutorRunIds = new Set<string>();

async function waitForTabComplete(tabId: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('TAB_LOAD_TIMEOUT');
}

async function sendMessageWithTimeout<T>(tabId: number, message: object, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('MESSAGE_TIMEOUT')), timeoutMs);
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      clearTimeout(timer);
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function waitForContentScriptReady(tabId: number, timeoutMs = 25000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await sendMessageWithTimeout<{ ok: boolean }>(
        tabId,
        {
          type: runtimeMessageTypes.pingContent,
          correlationId: createId('corr'),
        },
        3000,
      );

      if (response?.ok) {
        return;
      }
    } catch (error) {
      if (!(error instanceof Error) || !/Receiving end does not exist|Could not establish connection|The message port closed before a response was received/i.test(error.message)) {
        throw error;
      }
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/gemini-content.ts'],
      });
    } catch {
      // ignore reinjection failures and continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('CONTENT_SCRIPT_NOT_READY');
}

async function mirrorRunToHistory(run: Run): Promise<void> {
  await runRepository.updateRunHistoryRun(run.id, () => run);
  await runCalendarRepository.upsertFromRunWithBatchLookup(run);
}

async function updateRun(run: Run): Promise<void> {
  run.updatedAt = nowIso();
  const saved = await runRepository.saveActiveRunIfCurrent(run);
  if (!saved) {
    throw new Error('RUN_ABORTED');
  }
  await mirrorRunToHistory(run);
}

function markRunMessage(run: Run, message: string): void {
  run.progress.lastMessage = message;
}

function setCurrentStep(run: Run, label: string): void {
  run.progress.currentStepLabel = label;
}

async function refreshRunState(run: Run): Promise<Run> {
  const latest = await runRepository.getActiveRun();
  if (!latest || latest.id !== run.id) {
    throw new Error('RUN_ABORTED');
  }
  return latest;
}

function markRemainingJobsStopped(run: Run): void {
  for (const job of run.jobs) {
    if (job.status === 'pending' || job.status === 'launching') {
      job.status = 'stopped';
      job.errorMessage = 'RUN_STOPPED';
    }
  }
  run.progress.stoppedJobs = run.jobs.filter((job) => job.status === 'stopped').length;
}

async function waitWhilePaused(run: Run): Promise<Run> {
  let latestRun = run;
  while (latestRun.status === 'paused') {
    setCurrentStep(latestRun, 'Paused');
    markRunMessage(latestRun, 'Run is paused. Waiting to resume.');
    await updateRun(latestRun);
    await new Promise((resolve) => setTimeout(resolve, CONTROL_POLL_MS));
    latestRun = await refreshRunState(latestRun);
  }
  return latestRun;
}

async function ensureRunnable(run: Run): Promise<Run> {
  let latestRun = await refreshRunState(run);

  if (latestRun.status === 'paused') {
    latestRun = await waitWhilePaused(latestRun);
  }

  if (latestRun.status === 'stopped') {
    latestRun.progress.lastError = null;
    latestRun.progress.currentScriptId = null;
    setCurrentStep(latestRun, 'Launch cancelled');
    markRemainingJobsStopped(latestRun);
    markRunMessage(latestRun, 'Run stopped by user. Remaining launches have been cancelled.');
    await updateRun(latestRun);
    throw new Error('RUN_STOPPED');
  }

  return latestRun;
}

async function waitForConversationSettled(runId: string, scriptId: string, tabId: number, timeoutMs = 180000): Promise<void> {
  const start = Date.now();
  let lastResponseLength = 0;
  let settledSince = 0;

  while (Date.now() - start < timeoutMs) {
    const activeRun = await runRepository.getActiveRun();
    if (!activeRun || activeRun.id !== runId) {
      return;
    }

    const response = await sendMessageWithTimeout<MessageEnvelope<PageStateData>>(
      tabId,
      {
        type: runtimeMessageTypes.getPageState,
        correlationId: createId('corr'),
      },
      10000,
    );

    if (!response.success || !response.data) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    await runRepository.updateActiveRun((currentRun) => {
      if (currentRun.id !== runId) {
        return currentRun;
      }
      const job = currentRun.jobs.find((item) => item.scriptId === scriptId);
      if (!job) {
        return currentRun;
      }
      job.currentTabUrl = response.data?.url ?? job.currentTabUrl;
      currentRun.updatedAt = nowIso();
      return currentRun;
    });

    const responseLength = response.data.responseLength ?? response.data.latestResponseText?.length ?? 0;
    const settled = Boolean(response.data.sendReady) && !response.data.busyProcessing && responseLength > 0;

    if (settled) {
      if (responseLength !== lastResponseLength) {
        lastResponseLength = responseLength;
        settledSince = Date.now();
      }

      if (settledSince === 0) {
        settledSince = Date.now();
      }

      if (Date.now() - settledSince >= 1500) {
        await runRepository.updateActiveRun((currentRun) => {
          if (currentRun.id !== runId) {
            return currentRun;
          }
          const job = currentRun.jobs.find((item) => item.scriptId === scriptId);
          if (!job) {
            return currentRun;
          }
          job.currentTabUrl = response.data?.url ?? job.currentTabUrl;
          currentRun.updatedAt = nowIso();
          return currentRun;
        });
        return;
      }
    } else {
      settledSince = 0;
      lastResponseLength = responseLength;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function markJobFailed(run: Run, scriptId: string, errorMessage: string): Promise<void> {
  const job = run.jobs.find((item) => item.scriptId === scriptId);
  if (!job) {
    return;
  }

  if (job.status !== 'failed') {
    job.status = 'failed';
    job.errorMessage = errorMessage;
    run.progress.failedJobs = run.jobs.filter((item) => item.status === 'failed').length;
  }

  run.status = 'failed';
  run.progress.lastError = errorMessage;
  run.progress.currentScriptId = scriptId;
  setCurrentStep(run, `Launch failed for ${scriptId}`);
  markRunMessage(run, `Launch failed for ${scriptId}: ${errorMessage}`);
  await updateRun(run);
}

async function launchJob(run: Run, batch: ScriptBatch, jobIndex: number): Promise<Run> {
  run = await ensureRunnable(run);

  let currentJob = run.jobs[jobIndex];
  if (!currentJob) {
    return run;
  }

  const script = batch.scripts.find((item) => item.id === currentJob.scriptId);
  if (!script) {
    await markJobFailed(run, currentJob.scriptId, 'SCRIPT_NOT_FOUND');
    throw new Error('SCRIPT_NOT_FOUND');
  }

  currentJob.status = 'launching';
  currentJob.startedAt = nowIso();
  currentJob.errorMessage = null;
  run.status = 'running';
  run.currentJobIndex = jobIndex;
  run.progress.currentScriptId = currentJob.scriptId;
  setCurrentStep(run, `Opening tab for ${currentJob.scriptId}`);
  markRunMessage(run, `Opening profile ${run.profileSnapshot.name} for script ${currentJob.scriptId}.`);
  await updateRun(run);

  const createdTab = await chrome.tabs.create({ url: run.profileSnapshot.baseUrl, active: false });
  if (!createdTab.id) {
    await markJobFailed(run, currentJob.scriptId, 'TAB_CREATE_FAILED');
    throw new Error('TAB_CREATE_FAILED');
  }

  currentJob = run.jobs[jobIndex] ?? currentJob;
  currentJob.tabId = createdTab.id;
  currentJob.url = run.profileSnapshot.baseUrl;
  run.activeTabId = createdTab.id;
  setCurrentStep(run, `Waiting for tab ${createdTab.id}`);
  markRunMessage(run, `Opened tab ${createdTab.id} for script ${currentJob.scriptId}.`);
  await updateRun(run);

  await waitForTabComplete(createdTab.id);
  await waitForContentScriptReady(createdTab.id);
  run = await ensureRunnable(run);
  currentJob = run.jobs[jobIndex] ?? currentJob;

  const pageState = await sendMessageWithTimeout<MessageEnvelope<PageStateData>>(
    createdTab.id,
    {
      type: runtimeMessageTypes.pingPage,
      correlationId: createId('corr'),
    },
    10000,
  );

  currentJob.currentTabUrl = pageState.data?.url ?? createdTab.url ?? currentJob.currentTabUrl ?? null;
  await updateRun(run);

  if (!pageState.success || !pageState.data?.ready) {
    await markJobFailed(run, currentJob.scriptId, pageState.errorCode ?? 'PAGE_NOT_READY');
    throw new Error(pageState.errorCode ?? 'PAGE_NOT_READY');
  }

  setCurrentStep(run, `Submitting ${currentJob.scriptId}`);
  markRunMessage(run, `Submitting script ${currentJob.scriptId} to tab ${createdTab.id}.`);
  await updateRun(run);

  const prompt = currentJob.inputField === 'title' ? script.title : script.content;
  const submitResponse = await sendMessageWithTimeout<MessageEnvelope<SubmitScriptData>>(
    createdTab.id,
    {
      type: runtimeMessageTypes.submitScript,
      prompt,
      correlationId: createId('corr'),
    },
    30000,
  );

  if (!submitResponse.success || !submitResponse.data?.submitted) {
    await markJobFailed(run, currentJob.scriptId, submitResponse.errorCode ?? 'SUBMIT_SCRIPT_FAILED');
    throw new Error(submitResponse.errorCode ?? 'SUBMIT_SCRIPT_FAILED');
  }

  currentJob = run.jobs[jobIndex] ?? currentJob;
  currentJob.status = 'completed';
  currentJob.submittedAt = submitResponse.data.startedAt;
  currentJob.currentTabUrl = submitResponse.data.url;
  currentJob.errorMessage = null;
  run.progress.submittedJobs = run.jobs.filter((job) => job.status === 'submitted' || job.status === 'completed').length;
  run.progress.completedJobs = run.jobs.filter((job) => job.status === 'completed').length;
  run.progress.lastError = null;
  setCurrentStep(run, `Completed ${currentJob.scriptId}`);
  markRunMessage(run, `Script ${currentJob.scriptId} was sent successfully in tab ${createdTab.id}. Tab remains open.`);
  await updateRun(run);

  void waitForConversationSettled(run.id, currentJob.scriptId, createdTab.id).catch(() => {
    // non-blocking post-submit sync
  });

  await new Promise((resolve) => setTimeout(resolve, TAB_LAUNCH_THROTTLE_MS));
  return run;
}

export async function pauseActiveRun(): Promise<Run | null> {
  return await runRepository.updateActiveRun((run) => {
    if (!['queued', 'running'].includes(run.status)) {
      return run;
    }
    run.status = 'paused';
    setCurrentStep(run, 'Pause requested');
    run.progress.lastMessage = 'Pause requested. New tab launches will pause.';
    run.updatedAt = nowIso();
    return run;
  });
}

export async function resumeActiveRun(): Promise<{ ok: boolean; run: Run | null }> {
  const run = await runRepository.updateActiveRun((currentRun) => {
    if (currentRun.status !== 'paused') {
      return currentRun;
    }
    currentRun.status = 'running';
    setCurrentStep(currentRun, 'Run resumed');
    currentRun.progress.lastMessage = 'Run resumed.';
    currentRun.updatedAt = nowIso();
    return currentRun;
  });

  if (run && run.status === 'running') {
    void executeActiveRun();
  }

  return { ok: true, run };
}

export async function stopActiveRun(): Promise<Run | null> {
  const run = await runRepository.updateActiveRun((currentRun) => {
    if (!['queued', 'running', 'paused'].includes(currentRun.status)) {
      return currentRun;
    }

    currentRun.status = 'stopped';
    currentRun.progress.currentScriptId = null;
    markRemainingJobsStopped(currentRun);
    setCurrentStep(currentRun, 'Cancelling remaining launches');
    currentRun.progress.lastMessage = 'Cancelling pending launches. Opened tabs will remain open.';
    currentRun.updatedAt = nowIso();
    return currentRun;
  });

  return run;
}

export async function resetRunState(): Promise<void> {
  await runRepository.saveActiveRun(null);
}

export async function retryCurrentStage(): Promise<Run | null> {
  return await runRepository.updateActiveRun((currentRun) => currentRun);
}

export async function retryCurrentJob(): Promise<Run | null> {
  const run = await runRepository.updateActiveRun((currentRun) => {
    if (!['failed', 'completed', 'stopped'].includes(currentRun.status)) {
      return currentRun;
    }

    const currentJob = currentRun.jobs[currentRun.currentJobIndex];
    if (currentJob) {
      currentJob.status = 'pending';
      currentJob.errorMessage = null;
      currentJob.submittedAt = null;
      currentJob.startedAt = null;
      currentJob.tabId = null;
      currentJob.url = null;
      currentJob.output = '';
    }

    currentRun.status = 'running';
    currentRun.progress.failedJobs = currentRun.jobs.filter((job) => job.status === 'failed').length;
    currentRun.progress.submittedJobs = currentRun.jobs.filter((job) => job.status === 'submitted' || job.status === 'completed').length;
    currentRun.progress.completedJobs = currentRun.progress.submittedJobs;
    currentRun.progress.lastError = null;
    currentRun.progress.currentScriptId = currentJob?.scriptId ?? null;
    setCurrentStep(currentRun, 'Retrying current launch');
    currentRun.progress.lastMessage = 'Retrying current script launch.';
    currentRun.updatedAt = nowIso();
    return currentRun;
  });

  if (run?.status === 'running') {
    void executeActiveRun();
  }

  return run;
}

export async function skipCurrentScript(): Promise<Run | null> {
  const run = await runRepository.updateActiveRun((currentRun) => {
    const currentJob = currentRun.jobs[currentRun.currentJobIndex];
    if (!currentJob || !['queued', 'running', 'paused', 'failed'].includes(currentRun.status)) {
      return currentRun;
    }

    currentJob.status = 'skipped';
    currentJob.errorMessage = null;
    currentRun.progress.currentScriptId = null;
    currentRun.progress.lastError = null;
    setCurrentStep(currentRun, `Skipped ${currentJob.scriptId}`);
    currentRun.progress.lastMessage = `Skipped ${currentJob.scriptId}.`;
    currentRun.updatedAt = nowIso();
    return currentRun;
  });

  return run;
}

export async function relinkRunJobTab(runId: string, scriptId: string): Promise<{ ok: boolean; message: string }> {
  const historyRun = (await runRepository.getRunHistory()).find((run) => run.id === runId);
  const activeRun = await runRepository.getActiveRun();
  const sourceRun = activeRun?.id === runId ? activeRun : historyRun;

  if (!sourceRun) {
    return { ok: false, message: 'RUN_NOT_FOUND' };
  }

  const job = sourceRun.jobs.find((item) => item.scriptId === scriptId);
  const targetUrl = job?.currentTabUrl ?? job?.url;
  if (!job || !targetUrl) {
    return { ok: false, message: 'URL_NOT_AVAILABLE' };
  }

  const matchingTabs = await chrome.tabs.query({ url: targetUrl });
  let tab = matchingTabs.find((item) => typeof item.id === 'number');

  if (!tab) {
    tab = await chrome.tabs.create({ url: targetUrl, active: true });
  } else if (tab.id) {
    await chrome.tabs.update(tab.id, { active: true });
  }

  if (!tab?.id) {
    return { ok: false, message: 'TAB_RELINK_FAILED' };
  }

  await waitForTabComplete(tab.id);
  await waitForContentScriptReady(tab.id);

  const response = await sendMessageWithTimeout<MessageEnvelope<PageStateData>>(
    tab.id,
    {
      type: runtimeMessageTypes.getPageState,
      correlationId: createId('corr'),
    },
    10000,
  );

  const liveUrl = response.data?.url ?? targetUrl;

  if (activeRun?.id === runId) {
    await runRepository.updateActiveRun((run) => {
      const targetJob = run.jobs.find((item) => item.scriptId === scriptId);
      if (!targetJob) {
        return run;
      }
      targetJob.tabId = tab.id ?? null;
      targetJob.currentTabUrl = liveUrl;
      if (['failed', 'stopped'].includes(targetJob.status)) {
        targetJob.status = 'submitted';
      }
      run.updatedAt = nowIso();
      return run;
    });
  }

  await runRepository.updateRunHistoryRun(runId, (run) => {
    const targetJob = run.jobs.find((item) => item.scriptId === scriptId);
    if (!targetJob) {
      return run;
    }
    targetJob.tabId = tab.id ?? null;
    targetJob.currentTabUrl = liveUrl;
    if (['failed', 'stopped'].includes(targetJob.status)) {
      targetJob.status = 'submitted';
    }
    run.updatedAt = nowIso();
    return run;
  });

  return { ok: true, message: 'Tab relinked from URL successfully.' };
}

export async function submitTextToRunJobTab(runId: string, scriptId: string, text: string): Promise<{ ok: boolean; message: string }> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return { ok: false, message: 'TEXT_EMPTY' };
  }

  const historyRun = (await runRepository.getRunHistory()).find((run) => run.id === runId);
  const activeRun = await runRepository.getActiveRun();
  const sourceRun = activeRun?.id === runId ? activeRun : historyRun;

  if (!sourceRun) {
    return { ok: false, message: 'RUN_NOT_FOUND' };
  }

  const job = sourceRun.jobs.find((item) => item.scriptId === scriptId);
  const targetUrl = job?.currentTabUrl ?? job?.url;
  if (!job || !targetUrl) {
    return { ok: false, message: 'CURRENT_TAB_URL_NOT_AVAILABLE' };
  }

  const matchingTabs = await chrome.tabs.query({ url: targetUrl });
  let tab = job.tabId ? await chrome.tabs.get(job.tabId).catch(() => null) : null;
  tab = tab ?? matchingTabs.find((item) => typeof item.id === 'number') ?? null;
  if (!tab) {
    tab = await chrome.tabs.create({ url: targetUrl, active: true });
  } else if (tab.id) {
    await chrome.tabs.update(tab.id, { active: true });
  }

  if (!tab?.id) {
    return { ok: false, message: 'TAB_NOT_AVAILABLE' };
  }

  await waitForTabComplete(tab.id);
  await waitForContentScriptReady(tab.id);

  const response = await sendMessageWithTimeout<MessageEnvelope<SubmitScriptData>>(
    tab.id,
    {
      type: runtimeMessageTypes.submitScript,
      prompt: trimmedText,
      correlationId: createId('corr'),
    },
    30000,
  );

  if (!response.success || !response.data?.submitted) {
    return { ok: false, message: response.errorCode ?? 'SUBMIT_TEXT_FAILED' };
  }

  const updateJob = (run: Run) => {
    const targetJob = run.jobs.find((item) => item.scriptId === scriptId);
    if (!targetJob) {
      return run;
    }
    targetJob.tabId = tab.id ?? targetJob.tabId;
    targetJob.currentTabUrl = response.data?.url ?? targetJob.currentTabUrl;
    targetJob.status = 'completed';
    targetJob.submittedAt = response.data?.startedAt ?? nowIso();
    targetJob.errorMessage = null;
    run.updatedAt = nowIso();
    return run;
  };

  if (activeRun?.id === runId) {
    await runRepository.updateActiveRun(updateJob);
  }
  await runRepository.updateRunHistoryRun(runId, updateJob);

  return { ok: true, message: 'Submitted manual text to current tab URL successfully.' };
}

export async function collectScriptsForRunJob(runId: string, scriptId: string, mode: CollectOutputMode = 'japanese-scripts'): Promise<{ ok: boolean; message: string }> {
  const historyRun = (await runRepository.getRunHistory()).find((run) => run.id === runId);
  const activeRun = await runRepository.getActiveRun();
  const sourceRun = activeRun?.id === runId ? activeRun : historyRun;

  if (!sourceRun) {
    return { ok: false, message: 'RUN_NOT_FOUND' };
  }

  const job = sourceRun.jobs.find((item) => item.scriptId === scriptId);
  if (!job?.tabId) {
    return { ok: false, message: 'TAB_NOT_AVAILABLE' };
  }

  await waitForContentScriptReady(job.tabId);
  const response = await sendMessageWithTimeout<MessageEnvelope<CollectJapaneseScriptsData>>(
    job.tabId,
    {
      type: runtimeMessageTypes.collectJapaneseScripts,
      correlationId: createId('corr'),
    },
    15000,
  );

  if (!response.success || !response.data) {
    return { ok: false, message: response.errorCode ?? 'COLLECT_SCRIPTS_FAILED' };
  }

  if (activeRun?.id === runId) {
    await runRepository.updateActiveRun((run) => {
      const targetJob = run.jobs.find((item) => item.scriptId === scriptId);
      if (!targetJob) {
        return run;
      }
      targetJob.currentTabUrl = response.data?.currentTabUrl ?? targetJob.currentTabUrl;
      targetJob.output = mode === 'full-response'
        ? (response.data?.rawResponseText ?? targetJob.output)
        : (response.data?.combinedOutput ?? targetJob.output);
      run.updatedAt = nowIso();
      return run;
    });
  }

  await runRepository.updateRunHistoryRun(runId, (run) => {
    const targetJob = run.jobs.find((item) => item.scriptId === scriptId);
    if (!targetJob) {
      return run;
    }
    targetJob.currentTabUrl = response.data?.currentTabUrl ?? targetJob.currentTabUrl;
    targetJob.output = mode === 'full-response'
      ? (response.data?.rawResponseText ?? targetJob.output)
      : (response.data?.combinedOutput ?? targetJob.output);
    run.updatedAt = nowIso();
    return run;
  });

  return {
    ok: true,
    message: response.data.extractedScripts.length > 0
      ? `Collected ${response.data.extractedScripts.length} Japanese script block(s).`
      : 'No Japanese script blocks found in the current response.',
  };
}

export async function executeActiveRun(): Promise<void> {
  let run = await runRepository.getActiveRun();
  if (!run || !['queued', 'running'].includes(run.status)) {
    return;
  }

  if (activeExecutorRunIds.has(run.id)) {
    return;
  }

  activeExecutorRunIds.add(run.id);
  const batch = await batchRepository.getById(run.batchId) ?? await batchRepository.getOrCreateDefault();

  try {
    run.status = 'running';
    setCurrentStep(run, 'Launching selected scripts');
    markRunMessage(run, `Opening ${run.jobs.length} tab(s) for profile ${run.profileSnapshot.name}.`);
    await updateRun(run);

    for (let index = 0; index < run.jobs.length; index += 1) {
      run = await refreshRunState(run);
      run.currentJobIndex = index;

      const currentJob = run.jobs[index];
      if (!currentJob || ['submitted', 'completed', 'skipped'].includes(currentJob.status)) {
        continue;
      }

      run = await launchJob(run, batch, index);
    }

    run = await refreshRunState(run);
    if (run.status === 'stopped') {
      run.progress.currentScriptId = null;
      setCurrentStep(run, 'Launch stopped');
      markRunMessage(run, 'Run stopped. Opened tabs remain available.');
      await updateRun(run);
      return;
    }

    if (!run.jobs.some((job) => job.status === 'failed')) {
      run.status = 'completed';
      run.progress.currentScriptId = null;
      run.progress.lastError = null;
      setCurrentStep(run, 'All selected scripts submitted');
      markRunMessage(run, 'All selected scripts were submitted successfully. Opened tabs remain open.');
      await updateRun(run);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'RUN_ABORTED') {
      return;
    }

    run = await runRepository.getActiveRun();
    if (!run) {
      return;
    }

    if (error instanceof Error && error.message === 'RUN_STOPPED') {
      run.status = 'stopped';
      run.progress.currentScriptId = null;
      setCurrentStep(run, 'Launch cancelled');
      markRemainingJobsStopped(run);
      markRunMessage(run, 'Run stopped by user. Remaining launches cancelled.');
      await updateRun(run);
      return;
    }

    run.status = 'failed';
    run.progress.lastError = error instanceof Error ? error.message : 'RUN_FAILED';
    setCurrentStep(run, 'Launch execution failed');
    markRunMessage(run, `Run failed: ${run.progress.lastError}`);
    await updateRun(run);
  } finally {
    if (run) {
      activeExecutorRunIds.delete(run.id);
    }
  }
}
