import type { SearchDimension } from "@backend/domain/search-console/search-dimension";

export interface AnalyticsQuery {
  siteUrl: string;
  /** Inclusive start date, YYYY-MM-DD. */
  startDate: string;
  /** Inclusive end date, YYYY-MM-DD. */
  endDate: string;
  dimension: SearchDimension;
  rowLimit: number;
}

export interface GscAnalyticsRow {
  date: string;
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscCoverageRow {
  page: string;
  coverageState: string;
  verdict: string;
  lastCrawledAt: string | null;
}

/**
 * Port for reading data from Google Search Console. Implemented over the GSC
 * REST API in infrastructure; use cases depend only on this interface.
 */
export interface SearchConsoleGateway {
  fetchAnalytics(query: AnalyticsQuery): Promise<GscAnalyticsRow[]>;
  inspectUrl(siteUrl: string, page: string): Promise<GscCoverageRow>;
}
