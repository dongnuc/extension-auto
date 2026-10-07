import { RunConfigPanel } from '../components/run/RunConfigPanel';
import { RunPreviewPanel } from '../components/run/RunPreviewPanel';
import { useRunConfiguration } from '../hooks/useRunConfiguration';

export function RunPage() {
  const {
    enabledProfiles,
    batches,
    batch,
    activeRun,
    selectedProfile,
    selectedBatchId,
    selectedProfileId,
    selectedInputField,
    selectedScriptIds,
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
  } = useRunConfiguration();

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading run configuration...</h2>
      </section>
    );
  }

  return (
    <div className="run-split-layout">
      <RunConfigPanel
        profiles={enabledProfiles}
        batches={batches}
        batch={batch}
        selectedBatchId={selectedBatchId}
        selectedProfileId={selectedProfileId}
        selectedInputField={selectedInputField}
        selectedScriptIds={selectedScriptIds}
        activeRun={activeRun}
        errors={validation.errors}
        submitMessage={submitMessage}
        onSelectBatch={changeSelectedBatchId}
        onSelectProfile={setSelectedProfileId}
        onSelectInputField={setSelectedInputField}
        onToggleScript={toggleScriptSelection}
        onSelectAllScripts={selectAllScripts}
        onClearAllScripts={clearAllScripts}
        onStartRun={startRun}
        onPauseRun={pauseRun}
        onResumeRun={resumeRun}
        onStopRun={stopRun}
        onRetryCurrentStage={retryCurrentStage}
        onRetryCurrentJob={retryCurrentJob}
        onSkipCurrentScript={skipCurrentScript}
        onResetRunState={resetRunState}
        onClearActiveRun={clearActiveRun}
      />
      <RunPreviewPanel profile={selectedProfile} batch={batch} selectedScriptIds={selectedScriptIds} activeRun={activeRun} />
    </div>
  );
}
