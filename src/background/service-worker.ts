import {
  collectScriptsForRunJob,
  executeActiveRun,
  pauseActiveRun,
  relinkRunJobTab,
  resetRunState,
  resumeActiveRun,
  retryCurrentJob,
  retryCurrentStage,
  skipCurrentScript,
  stopActiveRun,
  submitTextToRunJobTab,
} from './run-executor';
import { runtimeMessageTypes, type CollectOutputMode, type PingBackgroundResponse, type RunStatusResponse } from '../shared/messaging/contracts';
import { runRepository } from '../storage/repositories';
import { extractYoutubeTranscriptByTab } from './youtube-tab-extractor';
import { nowIso } from '../shared/utils/time';

async function resumeInterruptedRunIfNeeded(): Promise<void> {
  const run = await runRepository.getActiveRun();
  if (!run) {
    return;
  }

  if (['queued', 'running'].includes(run.status)) {
    run.progress.lastMessage = 'Restored active run. Resuming execution.';
    run.progress.currentStepLabel = 'Resuming interrupted run';
    run.updatedAt = nowIso();
    await runRepository.saveActiveRun(run);
    void executeActiveRun();
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.info('Gem Auto Flow extension installed.');
  void resumeInterruptedRunIfNeeded();
});

void resumeInterruptedRunIfNeeded();

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const run = await runRepository.getActiveRun();
  if (!run || run.activeTabId !== tabId) {
    return;
  }

  run.activeTabId = null;
  if (run.status === 'running') {
    run.status = 'failed';
    run.progress.lastError = 'TAB_CLOSED_MANUALLY';
    run.progress.lastMessage = 'Execution stopped because the Gemini tab was closed manually.';
  }
  run.updatedAt = nowIso();
  await runRepository.saveActiveRun(run);
});

async function getRunStatusResponse(): Promise<RunStatusResponse> {
  const run = await runRepository.getActiveRun();
  return {
    ok: true,
    status: run?.status ?? 'idle',
    activeRunId: run?.id ?? null,
  };
}

chrome.runtime.onMessage.addListener((message: { type?: string; runId?: string; scriptId?: string; text?: string; mode?: CollectOutputMode; url?: string }, _sender, sendResponse) => {
  if (message.type === runtimeMessageTypes.pingBackground) {
    const response: PingBackgroundResponse = {
      ok: true,
      message: 'Background service worker is alive.',
      timestamp: nowIso(),
    };
    sendResponse(response);
    return false;
  }

  if (message.type === runtimeMessageTypes.getRunStatus) {
    void getRunStatusResponse().then(sendResponse);
    return true;
  }

  if (message.type === runtimeMessageTypes.startRunExecution) {
    void executeActiveRun().catch((error: unknown) => {
      console.error('Run execution failed.', error);
    });
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === runtimeMessageTypes.pauseRunExecution) {
    void pauseActiveRun().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.resumeRunExecution) {
    void resumeActiveRun().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.stopRunExecution) {
    void stopActiveRun().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.retryCurrentStage) {
    void retryCurrentStage().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.retryCurrentJob) {
    void retryCurrentJob().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.skipCurrentScript) {
    void skipCurrentScript().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.resetRunState) {
    void resetRunState().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.collectJapaneseScripts) {
    void collectScriptsForRunJob(message.runId ?? '', message.scriptId ?? '', message.mode ?? 'japanese-scripts').then(sendResponse);
    return true;
  }

  if (message.type === runtimeMessageTypes.relinkRunJobTab) {
    void relinkRunJobTab(message.runId ?? '', message.scriptId ?? '').then(sendResponse);
    return true;
  }

  if (message.type === runtimeMessageTypes.submitTextToRunJobTab) {
    void submitTextToRunJobTab(message.runId ?? '', message.scriptId ?? '', message.text ?? '').then(sendResponse);
    return true;
  }

  if (message.type === runtimeMessageTypes.clearActiveRun) {
    void runRepository.saveActiveRun(null).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === runtimeMessageTypes.extractYoutubeTranscriptByTab) {
    void extractYoutubeTranscriptByTab(message.url ?? '')
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error: unknown) => sendResponse({ ok: false, message: error instanceof Error ? error.message : 'YOUTUBE_TAB_EXTRACTION_FAILED' }));
    return true;
  }

  return false;
});
