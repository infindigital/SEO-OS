import type { ClientView } from "@backend/application/client/dto";
import type { ConnectionStatus } from "@backend/domain/search-console/connection";

export interface ClientGscSummary {
  siteUrl: string;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
}

export interface AgencyClientRow {
  client: ClientView;
  gsc: ClientGscSummary | null;
}

export interface AgencyOverview {
  clientCount: number;
  connectedCount: number;
  totals: { clicks: number; impressions: number; ctr: number };
  clients: AgencyClientRow[];
}

export interface AnalyticsRowView {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface CoverageBucket {
  state: string;
  count: number;
}

export interface ClientDashboard {
  client: ClientView;
  connection: {
    siteUrl: string;
    status: ConnectionStatus;
    lastSyncedAt: string | null;
  } | null;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: AnalyticsRowView[];
  topPages: AnalyticsRowView[];
  coverage: CoverageBucket[];
}
