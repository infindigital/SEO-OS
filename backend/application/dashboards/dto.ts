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

/** Headline counters for the internal (agency operations) dashboard. */
export interface InternalDashboardCards {
  totalClients: number;
  monthlyRevenue: number;
  openTasks: number;
  criticalIssues: number;
  reportsPending: number;
  activeDevelopers: number;
  averageSeoScore: number | null;
}

export interface SeoHealthPoint {
  date: string;
  score: number;
}

export interface ClientGrowthPoint {
  /** First day of the month, ISO-8601. */
  month: string;
  added: number;
  total: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface TaskCompletionPoint {
  date: string;
  open: number;
  completed: number;
}

export interface InternalDashboard {
  rangeDays: number;
  hasData: boolean;
  cards: InternalDashboardCards;
  seoHealth: SeoHealthPoint[];
  clientGrowth: ClientGrowthPoint[];
  revenue: RevenuePoint[];
  taskCompletion: TaskCompletionPoint[];
}

export interface InternalDashboardQuery {
  days?: number;
}
