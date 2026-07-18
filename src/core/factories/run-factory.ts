import type { GemProfile, Run, RunInputField, ScriptBatch } from '../models';
import { createId } from '../../shared/utils/id';
import { nowIso } from '../../shared/utils/time';
import { createProfileSnapshot } from './profile-factory';

export function createRun(profile: GemProfile, batch: ScriptBatch, selectedScriptIds: string[], inputField: RunInputField = 'content'): Run {
  const timestamp = nowIso();
  const selectedScripts = batch.scripts.filter((script) => selectedScriptIds.includes(script.id));

  return {
    id: createId('run'),
    batchId: batch.id,
    profileSnapshot: createProfileSnapshot(profile),
    selectedScriptIds,
    jobs: selectedScripts.map((script, index) => ({
      scriptId: script.id,
      scriptTitle: script.title,
      scriptNumberNo: script.numberNo || null,
      profileName: profile.name,
      inputField,
      order: index,
      status: 'pending',
      tabId: null,
      url: null,
      currentTabUrl: null,
      startedAt: null,
      submittedAt: null,
      output: '',
      errorMessage: null,
      source: script.source ?? null,
      sheetWriteback: {
        status: script.source ? 'ready' : 'idle',
        targetRowNumber: null,
        targetColumn: script.source?.outputColumn ?? null,
        writtenAt: null,
        message: null,
      },
    })),
    currentJobIndex: 0,
    status: 'queued',
    activeTabId: null,
    progress: {
      totalJobs: selectedScripts.length,
      completedJobs: 0,
      failedJobs: 0,
      stoppedJobs: 0,
      submittedJobs: 0,
      currentScriptId: selectedScripts[0]?.id ?? null,
      currentStageId: null,
      currentStageName: null,
      currentStageIndex: null,
      retryMode: 'none',
      currentStepLabel: 'Launch queue created.',
      lastMessage: 'Run created and waiting to open tabs.',
      lastError: null,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
