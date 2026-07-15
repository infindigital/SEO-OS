import type { IssueSeverity, SeoIssue } from "../analysis/issue";
import { issueKey } from "./issue-key";

/** Relative weight of each severity, used for the improvement score. */
export const SEVERITY_WEIGHT: Record<IssueSeverity, number> = {
  error: 3,
  warning: 2,
  notice: 1,
};

export interface ComparisonCounts {
  newIssues: number;
  resolvedIssues: number;
  remainingIssues: number;
  previousTotal: number;
  currentTotal: number;
}

export interface CrawlComparison {
  newIssues: SeoIssue[];
  resolvedIssues: SeoIssue[];
  remainingIssues: SeoIssue[];
  counts: ComparisonCounts;
  improvementScore: number;
}

function weigh(issues: SeoIssue[]): number {
  return issues.reduce((sum, issue) => sum + SEVERITY_WEIGHT[issue.severity], 0);
}

/**
 * Signed improvement score in [-100, 100]: the percentage reduction in weighted
 * issue burden versus the previous crawl. Positive means fewer/less-severe
 * issues; negative means a regression.
 */
export function improvementScore(
  previous: SeoIssue[],
  current: SeoIssue[],
): number {
  const previousWeight = weigh(previous);
  const currentWeight = weigh(current);

  if (previousWeight === 0) {
    return currentWeight === 0 ? 0 : -100;
  }

  const raw = ((previousWeight - currentWeight) / previousWeight) * 100;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}

/** Compare the previous and current issue sets into new/resolved/remaining. */
export function compareIssues(
  previous: SeoIssue[],
  current: SeoIssue[],
): CrawlComparison {
  const previousKeys = new Set(previous.map(issueKey));
  const currentKeys = new Set(current.map(issueKey));

  const newIssues = current.filter(
    (issue) => !previousKeys.has(issueKey(issue)),
  );
  const remainingIssues = current.filter((issue) =>
    previousKeys.has(issueKey(issue)),
  );
  const resolvedIssues = previous.filter(
    (issue) => !currentKeys.has(issueKey(issue)),
  );

  return {
    newIssues,
    resolvedIssues,
    remainingIssues,
    counts: {
      newIssues: newIssues.length,
      resolvedIssues: resolvedIssues.length,
      remainingIssues: remainingIssues.length,
      previousTotal: previous.length,
      currentTotal: current.length,
    },
    improvementScore: improvementScore(previous, current),
  };
}
