import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRun } from '../../core/factories';
import type { GemProfile, Run, RunInputField, ScriptBatch } from '../../core/models';
import { validateRunConfiguration } from '../../core/validation';
import { runtimeMessageTypes } from '../../shared/messaging/contracts';
import { batchRepository, profileRepository, runRepository } from '../../storage/repositories';

const RUN_REFRESH_MS = 500;

type RuntimeActionResponse = {
  ok: boolean;
  message?: string;
};

async function sendRuntimeAction(type: string): Promise<RuntimeActionResponse> {
  try {
    const response = (await chrome.runtime.sendMessage({ type })) as RuntimeActionResponse | undefined;
    if (!response) {
      return {
        ok: false,
        message: 'Background service worker did not respond. Please reload the extension and try again.',
      };
    }
    return response;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to contact background service worker.',
    };
  }
}

export function useRunConfiguration() {
  const [profiles, setProfiles] = useState<GemProfile[]>([]);
  const [batches, setBatches] = useState<ScriptBatch[]>([]);
  const [batch, setBatch] = useState<ScriptBatch | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedInputField, setSelectedInputField] = useState<RunInputField>('content');
  const [selectedScriptIds, setSelectedScriptIds] = useState<string[]>([]);
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<string>('');

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const enabledProfiles = useMemo(() => profiles.filter((profile) => profile.enabled), [profiles]);
  const selectableScripts = useMemo(() => batch?.scripts.filter((script) => script.enabled) ?? [], [batch]);
  const validation = useMemo(
    () => validateRunConfiguration(selectedProfile, batch, selectedScriptIds),
    [selectedProfile, batch, selectedScriptIds],
  );

  const loadState = useCallback(async () => {
    const [loadedProfiles, loadedBatches, loadedActiveRun] = await Promise.all([
      profileRepository.getAll(),
      batchRepository.getAll(),
      runRepository.getActiveRun(),
    ]);

    const ensuredBatches = loadedBatches.length > 0 ? loadedBatches : [await batchRepository.getOrCreateDefault()];
    const enabled = loadedProfiles.filter((profile) => profile.enabled);
    const nextBatch = ensuredBatches.find((item) => item.id === selectedBatchId) ?? ensuredBatches[0] ?? null;

    setProfiles(loadedProfiles);
    setBatches(ensuredBatches);
    setBatch(nextBatch);
    setSelectedBatchId(nextBatch?.id ?? '');
    setSelectedProfileId((current) => current || enabled[0]?.id || loadedProfiles[0]?.id || '');
    setSelectedScriptIds((current) =>
      current.length > 0 && nextBatch
        ? current.filter((id) => nextBatch.scripts.some((script) => script.id === id))
        : (nextBatch?.scripts.filter((script) => script.enabled).map((script) => script.id) ?? []),
    );
    setActiveRun(loadedActiveRun);
    setLoading(false);
  }, [selectedBatchId]);

  useEffect(() => {
    const load = async () => {
      await loadState();
    };

    void load();
  }, [loadState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void runRepository.getActiveRun().then((run) => {
        setActiveRun(run);
      });
    }, RUN_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const changeSelectedBatchId = useCallback((batchId: string) => {
    setSelectedBatchId(batchId);
    const nextBatch = batches.find((item) => item.id === batchId) ?? null;
    setBatch(nextBatch);
    setSelectedScriptIds(nextBatch?.scripts.filter((script) => script.enabled).map((script) => script.id) ?? []);
  }, [batches]);

  const toggleScriptSelection = useCallback((scriptId: string) => {
    setSelectedScriptIds((current) =>
      current.includes(scriptId) ? current.filter((id) => id !== scriptId) : [...current, scriptId],
    );
  }, []);

  const selectAllScripts = useCallback(() => {
    setSelectedScriptIds(selectableScripts.map((script) => script.id));
  }, [selectableScripts]);

  const clearAllScripts = useCallback(() => {
    setSelectedScriptIds([]);
  }, []);

  const startRun = useCallback(async () => {
    const latestActiveRun = await runRepository.getActiveRun();

    if (latestActiveRun && ['queued', 'running', 'paused'].includes(latestActiveRun.status)) {
      setActiveRun(latestActiveRun);
      setSubmitMessage('An active run already exists. Reset or finish it before starting another run.');
      return;
    }

    if (latestActiveRun && ['stopped', 'completed', 'failed'].includes(latestActiveRun.status)) {
      await runRepository.saveActiveRun(null);
      setActiveRun(null);
    }

    if (!batch || !selectedProfile || !validation.isValid) {
      setSubmitMessage('Run configuration is invalid. Please fix the errors before starting.');
      return;
    }

    const run = createRun(selectedProfile, batch, selectedScriptIds, selectedInputField);
    await runRepository.saveActiveRun(run);
    await runRepository.appendRunHistory(run);
    setActiveRun(run);

    const response = await sendRuntimeAction(runtimeMessageTypes.startRunExecution);

    if (!response.ok) {
      setSubmitMessage(response.message ?? 'Failed to start run execution.');
      await loadState();
      return;
    }

    await loadState();
    setSubmitMessage(`Run started with ${run.jobs.length} job(s).`);
  }, [batch, loadState, selectedInputField, selectedProfile, selectedScriptIds, validation.isValid]);

  const pauseRun = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.pauseRunExecution);
    await loadState();
    setSubmitMessage(response.ok ? 'Pause requested. The run will pause after the current step.' : (response.message ?? 'Failed to request pause.'));
  }, [loadState]);

  const resumeRun = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.resumeRunExecution);
    await loadState();
    setSubmitMessage(response.ok ? 'Run resumed.' : (response.message ?? 'Failed to resume run.'));
  }, [loadState]);

  const stopRun = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.stopRunExecution);
    await loadState();
    setSubmitMessage(response.ok ? 'Queue cancellation requested.' : (response.message ?? 'Failed to cancel queue.'));
  }, [loadState]);

  const retryCurrentStage = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.retryCurrentStage);
    await loadState();
    setSubmitMessage(response.ok ? 'Retrying current stage.' : (response.message ?? 'Failed to retry current stage.'));
  }, [loadState]);

  const retryCurrentJob = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.retryCurrentJob);
    await loadState();
    setSubmitMessage(response.ok ? 'Retrying current job from the beginning.' : (response.message ?? 'Failed to retry current job.'));
  }, [loadState]);

  const skipCurrentScript = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.skipCurrentScript);
    await loadState();
    setSubmitMessage(response.ok ? 'Skipped current script and moved to the next queue item.' : (response.message ?? 'Failed to skip current script.'));
  }, [loadState]);

  const resetRunState = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.resetRunState);
    if (response.ok) {
      setActiveRun(null);
    }
    await loadState();
    setSubmitMessage(response.ok ? 'Run state reset. You can start a completely new run now.' : (response.message ?? 'Failed to reset run state.'));
  }, [loadState]);

  const clearActiveRun = useCallback(async () => {
    const response = await sendRuntimeAction(runtimeMessageTypes.clearActiveRun);
    if (response.ok) {
      setActiveRun(null);
    }
    await loadState();
    setSubmitMessage(response.ok ? 'Run state cleared.' : (response.message ?? 'Failed to clear run state.'));
  }, [loadState]);

  return {
    profiles,
    enabledProfiles,
    batches,
    batch,
    activeRun,
    selectedProfile,
    selectedBatchId,
    selectedProfileId,
    selectedInputField,
    selectedScriptIds,
    selectableScripts,
    loading,
    validation,
    submitMessage,
    changeSelectedBatchId,
    setSelectedProfileId,
    setSelectedInputField,
    toggleScriptSelection,
    selectAllScripts,
    clearAllScripts,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    retryCurrentStage,
    retryCurrentJob,
    skipCurrentScript,
    resetRunState,
    clearActiveRun,
  };
}
