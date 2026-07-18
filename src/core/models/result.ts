import type { JobStatus } from './run';

export type StageExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface StageAttempt {
  attempt: number;
  startedAt: string;
  endedAt: string | null;
  status: StageExecutionStatus;
  errorMessage: string | null;
}

export interface StageResult {
  id: string;
  runId: string;
  jobId: string;
  stageId: string;
  stageName: string;
  input: string;
  response: string;
  startedAt: string;
  endedAt: string | null;
  status: StageExecutionStatus;
  errorMessage: string | null;
  attempts: StageAttempt[];
}

export interface JobResult {
  id: string;
  runId: string;
  scriptId: string;
  outputStageId: string;
  finalOutput: string;
  status: Exclude<JobStatus, 'pending' | 'running'>;
  stageResultIds: string[];
  startedAt: string;
  endedAt: string | null;
  errorMessage: string | null;
}
