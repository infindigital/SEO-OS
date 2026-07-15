import type { CrawlResult } from "../crawl/crawl-result";
import type { PageAudit } from "../crawl/page-audit";
import {
  ISSUE_SEVERITY,
  SEO_ISSUE_TYPES,
  type IssueSeverity,
  type SeoIssue,
  type SeoIssueType,
} from "./issue";
import { DEFAULT_THRESHOLDS, type AnalysisThresholds } from "./thresholds";

export interface AnalysisSummary {
  totalPages: number;
  totalIssues: number;
  byType: Record<SeoIssueType, number>;
  bySeverity: Record<IssueSeverity, number>;
}

export interface AnalysisOutcome {
  issues: SeoIssue[];
  summary: AnalysisSummary;
}

function isSuccess(page: PageAudit): boolean {
  return (
    page.statusCode !== null &&
    page.statusCode >= 200 &&
    page.statusCode < 300
  );
}

function isNoindex(page: PageAudit): boolean {
  return (page.metaRobots ?? "").toLowerCase().includes("noindex");
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function pushToGroup(
  groups: Map<string, string[]>,
  key: string,
  url: string,
): void {
  const existing = groups.get(key);
  if (existing) {
    existing.push(url);
  } else {
    groups.set(key, [url]);
  }
}

/**
 * Rule-based SEO analysis of a crawl result. Pure: given the same crawl and
 * thresholds it always produces the same issues. No AI, no I/O.
 */
export function analyzeCrawl(
  crawl: CrawlResult,
  thresholds: AnalysisThresholds = DEFAULT_THRESHOLDS,
): AnalysisOutcome {
  const pages = crawl.pages;
  const issues: SeoIssue[] = [];
  const add = (type: SeoIssueType, url: string, message: string): void => {
    issues.push({ type, severity: ISSUE_SEVERITY[type], url, message });
  };

  // Map every known URL to its status, for broken-link detection.
  const statusByUrl = new Map<string, number | null>();
  for (const page of pages) {
    statusByUrl.set(page.url, page.statusCode);
    if (page.finalUrl) {
      statusByUrl.set(page.finalUrl, page.statusCode);
    }
  }

  const titleGroups = new Map<string, string[]>();
  const descriptionGroups = new Map<string, string[]>();

  for (const page of pages) {
    if (page.statusCode !== null && page.statusCode >= 400) {
      add("http_error", page.url, `Page returned HTTP ${page.statusCode}.`);
    }

    const redirectChain = page.redirectChain ?? [];
    if (redirectChain.length >= thresholds.redirectChainMinHops) {
      add(
        "redirect_chain",
        page.url,
        `Redirect chain of ${redirectChain.length} hops before the final URL.`,
      );
    }

    if (isSuccess(page)) {
      if (page.title && page.title.trim().length > 0) {
        pushToGroup(titleGroups, normalizeText(page.title), page.url);
      }
      if (page.metaDescription && page.metaDescription.trim().length > 0) {
        pushToGroup(
          descriptionGroups,
          normalizeText(page.metaDescription),
          page.url,
        );
      }

      if (page.h1.length === 0) {
        add("missing_h1", page.url, "Page has no H1 heading.");
      }

      if (page.canonical === null) {
        add("missing_canonical", page.url, "Page has no canonical URL.");
      }

      if (!isNoindex(page) && page.wordCount < thresholds.thinContentWordCount) {
        add(
          "thin_content",
          page.url,
          `Thin content: ${page.wordCount} words (below ${thresholds.thinContentWordCount}).`,
        );
      }
    }

    if (page.imagesMissingAlt > 0) {
      add(
        "missing_alt",
        page.url,
        `${page.imagesMissingAlt} image(s) missing alt text.`,
      );
    }

    for (const image of page.images ?? []) {
      if (image.bytes !== null && image.bytes > thresholds.largeImageBytes) {
        add(
          "large_image",
          page.url,
          `Large image ${image.url} (${Math.round(image.bytes / 1024)} KB).`,
        );
      }
    }

    for (const link of page.internalLinks) {
      const status = statusByUrl.get(link);
      if (status !== undefined && status !== null && status >= 400) {
        add(
          "broken_link",
          page.url,
          `Links to broken page ${link} (HTTP ${status}).`,
        );
      }
    }
  }

  for (const urls of titleGroups.values()) {
    if (urls.length > 1) {
      for (const url of urls) {
        add(
          "duplicate_title",
          url,
          `Duplicate title shared by ${urls.length} pages.`,
        );
      }
    }
  }

  for (const urls of descriptionGroups.values()) {
    if (urls.length > 1) {
      for (const url of urls) {
        add(
          "duplicate_description",
          url,
          `Duplicate meta description shared by ${urls.length} pages.`,
        );
      }
    }
  }

  return { issues, summary: summarize(pages.length, issues) };
}

function summarize(totalPages: number, issues: SeoIssue[]): AnalysisSummary {
  const byType = Object.fromEntries(
    SEO_ISSUE_TYPES.map((type) => [type, 0]),
  ) as Record<SeoIssueType, number>;
  const bySeverity: Record<IssueSeverity, number> = {
    error: 0,
    warning: 0,
    notice: 0,
  };

  for (const issue of issues) {
    byType[issue.type] += 1;
    bySeverity[issue.severity] += 1;
  }

  return { totalPages, totalIssues: issues.length, byType, bySeverity };
}
