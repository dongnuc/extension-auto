export interface ScriptSourceMetadata {
  spreadsheetId: string;
  sheetUrl: string;
  sourceRowNumber: number;
  titleColumn: string;
  contentColumn: string;
  videoTitleColumn: string;
  outputColumn: string;
  videoTitle: string;
}

export interface Script {
  id: string;
  numberNo: string;
  title: string;
  content: string;
  enabled: boolean;
  order: number;
  source?: ScriptSourceMetadata;
}

export interface ScriptBatch {
  id: string;
  name: string;
  scripts: Script[];
  createdAt: string;
  updatedAt: string;
}
