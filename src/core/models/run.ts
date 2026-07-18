import type { ScriptSourceMetadata } from './script';
import type { GemProfile } from './profile';

export type RunStatus = 'idle' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
export type JobStatus = 'pending' | 'launching' | 'submitted' | 'running' | 'completed' | 'failed' | 'skipped' | 'stopped';
export type SheetWritebackStatus = 'idle' | 'ready' | 'written' | 'ambiguous' | 'missing-source' | 'write-failed';

export interface SheetWritebackState {
  status: SheetWritebackStatus;
  targetRowNumber: number | null;
  targetColumn: string | null;
  writtenAt: string | null;
  message: string | null;
}

export type RunInputField = 'content' | 'title';

export interface RunJob {
  scriptId: string;
  scriptTitle: string;
  scriptNumberNo: string | null;
  profileName: string;
  inputField: RunInputField;
  order: number;
  status: JobStatus;
  tabId: number | null;
  url: string | null;
  currentTabUrl: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  output: string;
  errorMessage: string | null;
  source: ScriptSourceMetadata | null;
  sheetWriteback: SheetWritebackState;
}

export interface RunProgress {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  stoppedJobs: number;
  submittedJobs: number;
  currentScriptId: string | null;
  currentStageId: string | null;
  currentStageName: string | null;
  currentStageIndex: number | null;
  retryMode: 'none' | 'stage' | 'job';
  currentStepLabel: string;
  lastMessage: string;
  lastError: string | null;
}

export interface Run {
  id: string;
  batchId: string;
  profileSnapshot: GemProfile;
  selectedScriptIds: string[];
  jobs: RunJob[];
  currentJobIndex: number;
  status: RunStatus;
  activeTabId: number | null;
  progress: RunProgress;
  createdAt: string;
  updatedAt: string;
}
