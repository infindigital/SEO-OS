import { describe, expect, it } from "vitest";

import { GoogleSearchConsoleGateway } from "./google-search-console-gateway";
import type { FetchFn } from "./google-oauth";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GoogleSearchConsoleGateway", () => {
  it("requests search analytics and maps rows", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetchFn: FetchFn = async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      return jsonResponse({
        rows: [
          {
            keys: ["2026-07-01", "seo tools"],
            clicks: 10,
            impressions: 100,
            ctr: 0.1,
            position: 3.5,
          },
        ],
      });
    };
    const gateway = new GoogleSearchConsoleGateway(async () => "token", fetchFn);

    const rows = await gateway.fetchAnalytics({
      siteUrl: "https://ex.com/",
      startDate: "2026-07-01",
      endDate: "2026-07-28",
      dimension: "QUERY",
      rowLimit: 1000,
    });

    expect(rows).toEqual([
      {
        date: "2026-07-01",
        key: "seo tools",
        clicks: 10,
        impressions: 100,
        ctr: 0.1,
        position: 3.5,
      },
    ]);
    expect(calls[0].url).toContain(
      "/sites/https%3A%2F%2Fex.com%2F/searchAnalytics/query",
    );
    expect(calls[0].body).toMatchObject({
      dimensions: ["date", "query"],
      rowLimit: 1000,
    });
  });

  it("inspects a URL and maps coverage", async () => {
    const fetchFn: FetchFn = async () =>
      jsonResponse({
        inspectionResult: {
          indexStatusResult: {
            coverageState: "Submitted and indexed",
            verdict: "PASS",
            lastCrawlTime: "2026-07-10T00:00:00Z",
          },
        },
      });
    const gateway = new GoogleSearchConsoleGateway(async () => "token", fetchFn);

    const coverage = await gateway.inspectUrl(
      "https://ex.com/",
      "https://ex.com/page",
    );

    expect(coverage).toEqual({
      page: "https://ex.com/page",
      coverageState: "Submitted and indexed",
      verdict: "PASS",
      lastCrawledAt: "2026-07-10T00:00:00Z",
    });
  });

  it("throws on a non-ok analytics response", async () => {
    const gateway = new GoogleSearchConsoleGateway(
      async () => "t",
      async () => new Response("no", { status: 403 }),
    );

    await expect(
      gateway.fetchAnalytics({
        siteUrl: "s",
        startDate: "a",
        endDate: "b",
        dimension: "PAGE",
        rowLimit: 1,
      }),
    ).rejects.toThrow(/403/);
  });
});
