import type { PageAudit } from "./page-audit";

export interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
}

/** The complete result of a crawl, serialized to JSON. */
export interface CrawlResult {
  startUrl: string;
  host: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  options: CrawlOptions;
  pageCount: number;
  pages: PageAudit[];
}
