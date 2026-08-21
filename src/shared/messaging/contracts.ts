export const runtimeMessageTypes = {
  pingBackground: 'ping-background',
  pingContent: 'ping-content',
  getRunStatus: 'get-run-status',
  startRunExecution: 'start-run-execution',
  pauseRunExecution: 'pause-run-execution',
  resumeRunExecution: 'resume-run-execution',
  stopRunExecution: 'stop-run-execution',
  retryCurrentStage: 'retry-current-stage',
  retryCurrentJob: 'retry-current-job',
  skipCurrentScript: 'skip-current-script',
  resetRunState: 'reset-run-state',
  clearActiveRun: 'clear-active-run',
  pingPage: 'PING_PAGE',
  verifyGem: 'VERIFY_GEM',
  sendStage: 'SEND_STAGE',
  submitScript: 'SUBMIT_SCRIPT',
  collectJapaneseScripts: 'COLLECT_JAPANESE_SCRIPTS',
  relinkRunJobTab: 'RELINK_RUN_JOB_TAB',
  submitTextToRunJobTab: 'SUBMIT_TEXT_TO_RUN_JOB_TAB',
  cancelWait: 'CANCEL_WAIT',
  getPageState: 'GET_PAGE_STATE',
  extractYoutubeTranscriptFromPage: 'EXTRACT_YOUTUBE_TRANSCRIPT_FROM_PAGE',
  extractYoutubeTranscriptByTab: 'EXTRACT_YOUTUBE_TRANSCRIPT_BY_TAB',
} as const;

export type RuntimeMessageType =
  (typeof runtimeMessageTypes)[keyof typeof runtimeMessageTypes];

export interface MessageEnvelope<TData = unknown> {
  success: boolean;
  data: TData | null;
  errorCode: string | null;
  message: string;
  correlationId: string;
}

export interface PingBackgroundResponse {
  ok: true;
  message: string;
  timestamp: string;
}

export interface PingContentResponse {
  ok: true;
  url: string;
  title: string;
}

export interface RunStatusResponse {
  ok: true;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'queued' | 'completed' | 'failed';
  activeRunId: string | null;
}

export interface PageStateData {
  url: string;
  title: string;
  ready: boolean;
  gemName: string;
  sendReady?: boolean;
  generating?: boolean;
  busyProcessing?: boolean;
  latestResponseText?: string;
  responseLength?: number;
}

export interface VerifyGemData {
  actualGemName: string;
  expectedGemName: string;
  matches: boolean;
}

export interface SendStagePayload {
  stageId: string;
  prompt: string;
  stableSeconds: number;
  timeoutMs: number;
  correlationId: string;
}

export interface SubmitScriptPayload {
  prompt: string;
  correlationId: string;
}

export interface SendStageData {
  responseText: string;
  startedAt: string;
  endedAt: string;
  buttonTransitionSeen?: boolean;
  responseLength?: number;
  sendReadyRestored?: boolean;
}

export interface SubmitScriptData {
  submitted: boolean;
  startedAt: string;
  url: string;
  title: string;
  buttonTransitionSeen?: boolean;
}

export type CollectOutputMode = 'japanese-scripts' | 'full-response';

export interface CollectJapaneseScriptsPayload {
  correlationId: string;
  mode?: CollectOutputMode;
}

export interface CollectJapaneseScriptsData {
  currentTabUrl: string;
  rawResponseText: string;
  extractedScripts: string[];
  combinedOutput: string;
  collectedAt: string;
}

export interface RuntimeConversationStateData {
  currentTabUrl: string;
  sendReady: boolean;
  generating: boolean;
  busyProcessing: boolean;
  latestResponseText: string;
  responseLength: number;
}

export interface YoutubeTranscriptPageSegment {
  startMs: number;
  durationMs: number;
  timestamp: string;
  text: string;
}

export interface YoutubeTranscriptPageData {
  title: string;
  url: string;
  segments: YoutubeTranscriptPageSegment[];
  textNoTimestamp: string;
  textWithTimestamp: string;
}
