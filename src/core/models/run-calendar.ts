export interface RunCalendarItem {
  scriptId: string;
  scriptTitle: string;
  numberNo: string;
  profileName: string;
  profileUrl: string | null;
  generatedUrl: string | null;
  rowNumber: number | null;
  status: string;
  inputField: 'content' | 'title';
}

export interface RunCalendarEntry {
  runId: string;
  runIds: string[];
  calendarDate: string;
  profileName: string;
  batchId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: RunCalendarItem[];
}
