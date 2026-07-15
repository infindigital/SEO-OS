import { beforeEach, describe, expect, it } from "vitest";

import type { SeoIssue } from "../../domain/analysis/issue";
import { InMemoryClientMemoryStore } from "../../infrastructure/client-memory/in-memory-client-memory-store";
import type { AnalysisReport } from "../analysis/dto";
import { RecordCrawlComparison } from "./use-cases/record-crawl-comparison";

function issue(
  type: SeoIssue["type"],
  url: string,
  severity: SeoIssue["severity"] = "warning",
): SeoIssue {
  return { type, url, severity, message: "" };
}

function analysis(issues: SeoIssue[]): AnalysisReport {
  return {
    startUrl: "https://s/",
    host: "s",
    analyzedAt: "2026-07-15T00:00:00.000Z",
    thresholds: {
      thinContentWordCount: 250,
      largeImageBytes: 100 * 1024,
      redirectChainMinHops: 2,
    },
    summary: {
      totalPages: 1,
      totalIssues: issues.length,
      byType: {
        http_error: 0,
        broken_link: 0,
        redirect_chain: 0,
        duplicate_title: 0,
        duplicate_description: 0,
        missing_h1: 0,
        thin_content: 0,
        missing_canonical: 0,
        large_image: 0,
        missing_alt: 0,
      },
      bySeverity: { error: 0, warning: 0, notice: 0 },
    },
    issues,
  };
}

describe("RecordCrawlComparison", () => {
  let store: InMemoryClientMemoryStore;
  let useCase: RecordCrawlComparison;

  beforeEach(() => {
    store = new InMemoryClientMemoryStore();
    useCase = new RecordCrawlComparison(store);
  });

  it("baselines the first crawl and persists memory", async () => {
    const report = await useCase.execute({
      clientId: "acme",
      analysis: analysis([
        issue("http_error", "https://s/a", "error"),
        issue("missing_h1", "https://s/b"),
      ]),
    });

    expect(report.isFirstRun).toBe(true);
    expect(report.improvementScore).toBe(0); // no baseline
    expect(report.counts.newIssues).toBe(2);
    expect(report.counts.resolvedIssues).toBe(0);

    const memory = await store.load("acme");
    expect(memory?.currentIssues).toHaveLength(2);
    expect(memory?.history).toHaveLength(1);
  });

  it("compares the second crawl against the first and appends history", async () => {
    await useCase.execute({
      clientId: "acme",
      analysis: analysis([
        issue("http_error", "https://s/a", "error"),
        issue("missing_h1", "https://s/b"),
      ]),
    });

    const report = await useCase.execute({
      clientId: "acme",
      analysis: analysis([
        issue("missing_h1", "https://s/b"), // remaining
        issue("thin_content", "https://s/c"), // new
      ]),
    });

    expect(report.isFirstRun).toBe(false);
    expect(report.counts.newIssues).toBe(1);
    expect(report.counts.resolvedIssues).toBe(1); // http_error on /a resolved
    expect(report.counts.remainingIssues).toBe(1);
    expect(report.improvementScore).toBeGreaterThan(0); // burden 5 -> 4

    const memory = await store.load("acme");
    expect(memory?.currentIssues.map((i) => i.url).sort()).toEqual([
      "https://s/b",
      "https://s/c",
    ]);
    expect(memory?.history).toHaveLength(2);
  });
});
