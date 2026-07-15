export interface PortalKeyword {
  keyword: string;
  clicks: number;
}

export interface PortalCompletedWork {
  title: string;
  completedAt: string | null;
}

export type PortalTimelineKind = "onboarded" | "review" | "work" | "report";

export interface PortalTimelineItem {
  date: string;
  label: string;
  kind: PortalTimelineKind;
}

export interface PortalReport {
  id: string;
  title: string;
  period: string | null;
  summary: string | null;
  url: string | null;
  publishedAt: string;
}

/**
 * Curated, client-facing view of a client's engagement. Intentionally free of
 * technical details (crawl issues, task statuses, index coverage, etc.).
 */
export interface ClientPortal {
  client: {
    id: string;
    name: string;
    website: string | null;
    currentFocus: string | null;
  };
  seoScore: number | null;
  organicTraffic: {
    clicks: number;
    connected: boolean;
  };
  keywords: {
    total: number;
    top: PortalKeyword[];
  };
  completedWork: {
    total: number;
    recent: PortalCompletedWork[];
  };
  timeline: PortalTimelineItem[];
  reports: PortalReport[];
}

export interface PublishReportInput {
  clientId: string;
  title: string;
  period?: string | null;
  summary?: string | null;
  url?: string | null;
}
