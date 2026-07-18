import type { JobResult, StageResult, StageExecutionStatus } from '../models';
import { createId } from '../../shared/utils/id';
import { nowIso } from '../../shared/utils/time';

export function createStageResult(params: {
  runId: string;
  jobId: string;
  stageId: string;
  stageName: string;
  input: string;
  status?: StageExecutionStatus;
}): StageResult {
  const timestamp = nowIso();
  const status = params.status ?? 'pending';

  return {
    id: createId('stage-result'),
    runId: params.runId,
    jobId: params.jobId,
    stageId: params.stageId,
    stageName: params.stageName,
    input: params.input,
    response: '',
    startedAt: timestamp,
    endedAt: null,
    status,
    errorMessage: null,
    attempts: [
      {
        attempt: 1,
        startedAt: timestamp,
        endedAt: null,
        status,
        errorMessage: null,
      },
    ],
  };
}

export function createJobResult(params: {
  runId: string;
  scriptId: string;
  outputStageId: string;
}): JobResult {
  return {
    id: createId('job-result'),
    runId: params.runId,
    scriptId: params.scriptId,
    outputStageId: params.outputStageId,
    finalOutput: '',
    status: 'skipped',
    stageResultIds: [],
    startedAt: nowIso(),
    endedAt: null,
    errorMessage: null,
  };
}
