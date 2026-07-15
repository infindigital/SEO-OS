export interface SyncOptions {
  startDate?: string;
  endDate?: string;
  rowLimit?: number;
  coverageLimit?: number;
}

export interface SyncResult {
  connectionId: string;
  siteUrl: string;
  queryRows: number;
  pageRows: number;
  coverageRows: number;
}

export interface SyncAllResult {
  connections: number;
  synced: number;
  failed: number;
  results: SyncResult[];
  errors: { connectionId: string; error: string }[];
}
