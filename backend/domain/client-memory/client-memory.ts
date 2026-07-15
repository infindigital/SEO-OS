import type { SeoIssue } from "../analysis/issue";

export interface IssueCounts {
  total: number;
  error: number;
  warning: number;
  notice: number;
}

/** One entry in a client's crawl history. */
export interface CrawlMemorySnapshot {
  comparedAt: string;
  analyzedAt: string;
  issueCounts: IssueCounts;
  improvementScore: number;
  newIssues: number;
  resolvedIssues: number;
  remainingIssues: number;
}

/**
 * Persistent memory for a client: the latest issue set (to compare the next
 * crawl against) and the history of crawl snapshots (to show the trend).
 */
export interface ClientMemory {
  clientId: string;
  host: string;
  startUrl: string;
  firstSeenAt: string;
  lastCrawlAt: string;
  currentIssues: SeoIssue[];
  history: CrawlMemorySnapshot[];
}

export function countIssues(issues: SeoIssue[]): IssueCounts {
  const counts: IssueCounts = { total: issues.length, error: 0, warning: 0, notice: 0 };
  for (const issue of issues) {
    counts[issue.severity] += 1;
  }
  return counts;
}
