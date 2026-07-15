import type {
  ConnectionStatus,
  SearchConsoleConnection,
} from "@backend/domain/search-console/connection";
import type { SearchDimension } from "@backend/domain/search-console/search-dimension";

export interface AnalyticsRowInput {
  dimension: SearchDimension;
  key: string;
  date: Date;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface CoverageInput {
  page: string;
  coverageState: string;
  verdict: string;
  lastCrawledAt: Date | null;
}

export interface UpsertConnectionInput {
  clientId: string;
  siteUrl: string;
  refreshToken: string;
}

export interface SearchConsoleRepository {
  /** Connections eligible for sync (connected, with stored credentials). */
  listConnections(): Promise<SearchConsoleConnection[]>;
  getConnection(id: string): Promise<SearchConsoleConnection | null>;
  upsertConnection(
    input: UpsertConnectionInput,
  ): Promise<SearchConsoleConnection>;
  upsertAnalyticsRows(
    connectionId: string,
    rows: AnalyticsRowInput[],
  ): Promise<number>;
  upsertCoverage(connectionId: string, rows: CoverageInput[]): Promise<number>;
  markSynced(connectionId: string, at: Date): Promise<void>;
  setStatus(connectionId: string, status: ConnectionStatus): Promise<void>;
}
