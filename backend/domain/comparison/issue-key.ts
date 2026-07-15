import type { SeoIssue } from "../analysis/issue";

/**
 * Identity of an issue for cross-crawl comparison: its type on a specific page.
 * Comparison is therefore at (issue-type, page) granularity — stable across
 * crawls even as issue messages (e.g. an image's KB size) change.
 */
export function issueKey(issue: Pick<SeoIssue, "type" | "url">): string {
  return `${issue.type}|${issue.url}`;
}
