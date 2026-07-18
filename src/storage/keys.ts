export const STORAGE_KEYS = {
  profiles: 'gemAutoFlow.profiles',
  batches: 'gemAutoFlow.batches',
  activeRun: 'gemAutoFlow.activeRun',
  runHistory: 'gemAutoFlow.runHistory',
  resultIndex: 'gemAutoFlow.resultIndex',
  sheetImportForm: 'gemAutoFlow.sheetImportForm',
  runCalendar: 'gemAutoFlow.runCalendar',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
