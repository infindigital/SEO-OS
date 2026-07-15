import type { ConnectionStatus } from "@backend/domain/search-console/connection";
import type { SearchDimension } from "@backend/domain/search-console/search-dimension";

export interface ClientMetricSummary {
  clientId: string;
  siteUrl: string;
  status: ConnectionStatus;
  lastSyncedAt: Date | null;
  clicks: number;
  impressions: number;
}

export interface ConnectionRef {
  id: string;
  siteUrl: string;
  status: ConnectionStatus;
  lastSyncedAt: Date | null;
}

export interface MetricTotals {
  clicks: number;
  impressions: number;
  position: number;
}

export interface AggregatedRow {
  key: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface CoverageCount {
  state: string;
  count: number;
}

/** Read-side queries over stored Search Console data, for the dashboards. */
export interface SearchConsoleReadRepository {
  getClientMetricSummaries(): Promise<ClientMetricSummary[]>;
  getPrimaryConnection(clientId: string): Promise<ConnectionRef | null>;
  totals(connectionId: string, dimension: SearchDimension): Promise<MetricTotals>;
  topRows(
    connectionId: string,
    dimension: SearchDimension,
    limit: number,
  ): Promise<AggregatedRow[]>;
  coverageBreakdown(connectionId: string): Promise<CoverageCount[]>;
  /** Number of distinct keywords (query rows) tracked for a connection. */
  keywordCount(connectionId: string): Promise<number>;
}
