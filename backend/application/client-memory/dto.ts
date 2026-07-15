import type { SeoIssue } from "../../domain/analysis/issue";
import type { ComparisonCounts } from "../../domain/comparison/compare-issues";

export interface CrawlComparisonReport {
  clientId: string;
  host: string;
  startUrl: string;
  comparedAt: string;
  isFirstRun: boolean;
  improvementScore: number;
  counts: ComparisonCounts;
  newIssues: SeoIssue[];
  resolvedIssues: SeoIssue[];
  remainingIssues: SeoIssue[];
}
