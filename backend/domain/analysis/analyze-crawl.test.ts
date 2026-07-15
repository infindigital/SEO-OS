import { describe, expect, it } from "vitest";

import type { CrawlResult } from "../crawl/crawl-result";
import type { PageAudit } from "../crawl/page-audit";
import { analyzeCrawl } from "./analyze-crawl";
import type { SeoIssueType } from "./issue";

function page(overrides: Partial<PageAudit> & { url: string }): PageAudit {
  return {
    finalUrl: overrides.url,
    statusCode: 200,
    responseTimeMs: 10,
    redirectChain: [],
    title: "Title",
    metaDescription: "Description",
    canonical: overrides.url,
    metaRobots: null,
    h1: ["Heading"],
    h2: [],
    imageCount: 0,
    imagesMissingAlt: 0,
    images: [],
    wordCount: 800,
    schemaTypes: [],
    internalLinks: [],
    externalLinks: [],
    depth: 0,
    error: null,
    crawledAt: "2026-07-14T00:00:00.000Z",
    ...overrides,
  };
}

function crawl(pages: PageAudit[]): CrawlResult {
  return {
    startUrl: "https://s/",
    host: "s",
    startedAt: "2026-07-14T00:00:00.000Z",
    finishedAt: "2026-07-14T00:00:01.000Z",
    durationMs: 1000,
    options: { maxPages: 50, maxDepth: 2 },
    pageCount: pages.length,
    pages,
  };
}

function count(
  issues: { type: SeoIssueType }[],
  type: SeoIssueType,
): number {
  return issues.filter((issue) => issue.type === type).length;
}

describe("analyzeCrawl", () => {
  it("detects every issue category", () => {
    const result = crawl([
      page({
        url: "https://s/",
        title: "Home Page",
        metaDescription: "Shared description",
        internalLinks: ["https://s/broken"],
        images: [{ url: "https://s/a.png", bytes: 50 * 1024 }],
      }),
      page({
        url: "https://s/dup",
        title: "Home Page", // duplicate title
        metaDescription: "Shared description", // duplicate description
        imagesMissingAlt: 2, // missing alt
        images: [{ url: "https://s/big.jpg", bytes: 250 * 1024 }], // large image
      }),
      page({
        url: "https://s/thin",
        title: "Thin",
        metaDescription: "Thin page",
        h1: [], // missing h1
        canonical: null, // missing canonical
        wordCount: 40, // thin content
      }),
      page({ url: "https://s/broken", statusCode: 404, title: null }), // http error
      page({
        url: "https://s/redir",
        title: "Redirected",
        metaDescription: "Redir",
        redirectChain: ["https://s/old", "https://s/mid"], // redirect chain
      }),
    ]);

    const { issues, summary } = analyzeCrawl(result);

    expect(count(issues, "http_error")).toBe(1);
    expect(count(issues, "redirect_chain")).toBe(1);
    expect(count(issues, "duplicate_title")).toBe(2);
    expect(count(issues, "duplicate_description")).toBe(2);
    expect(count(issues, "missing_h1")).toBe(1);
    expect(count(issues, "thin_content")).toBe(1);
    expect(count(issues, "broken_link")).toBe(1);
    expect(count(issues, "missing_canonical")).toBe(1);
    expect(count(issues, "large_image")).toBe(1);
    expect(count(issues, "missing_alt")).toBe(1);

    expect(summary.totalPages).toBe(5);
    expect(summary.totalIssues).toBe(12);
    expect(summary.bySeverity.error).toBe(2); // http_error + broken_link
    expect(summary.bySeverity.warning).toBe(9);
    expect(summary.bySeverity.notice).toBe(1); // missing_alt
  });

  it("does not flag content issues on error pages", () => {
    const { issues } = analyzeCrawl(
      crawl([page({ url: "https://s/x", statusCode: 404, h1: [], canonical: null, wordCount: 0 })]),
    );
    expect(count(issues, "missing_h1")).toBe(0);
    expect(count(issues, "missing_canonical")).toBe(0);
    expect(count(issues, "thin_content")).toBe(0);
    expect(count(issues, "http_error")).toBe(1);
  });

  it("skips thin-content checks for noindex pages", () => {
    const { issues } = analyzeCrawl(
      crawl([
        page({ url: "https://s/n", metaRobots: "noindex,follow", wordCount: 10 }),
      ]),
    );
    expect(count(issues, "thin_content")).toBe(0);
  });

  it("respects custom thresholds", () => {
    const result = crawl([
      page({
        url: "https://s/",
        wordCount: 400,
        images: [{ url: "https://s/i.png", bytes: 80 * 1024 }],
      }),
    ]);
    const { issues } = analyzeCrawl(result, {
      thinContentWordCount: 500,
      largeImageBytes: 50 * 1024,
      redirectChainMinHops: 2,
    });
    expect(count(issues, "thin_content")).toBe(1); // 400 < 500
    expect(count(issues, "large_image")).toBe(1); // 80KB > 50KB
  });

  it("tolerates crawl reports missing the newer fields", () => {
    const legacy = page({ url: "https://s/" });
    (legacy as { redirectChain?: unknown }).redirectChain = undefined;
    (legacy as { images?: unknown }).images = undefined;

    expect(() => analyzeCrawl(crawl([legacy]))).not.toThrow();
  });
});
