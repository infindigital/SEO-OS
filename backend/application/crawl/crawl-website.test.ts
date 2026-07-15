import { describe, expect, it } from "vitest";

import { CrawlWebsite } from "./use-cases/crawl-website";
import type {
  FetchResult,
  PageFetcher,
  RawPageData,
} from "./ports/page-fetcher";

function page(links: string[], overrides: Partial<RawPageData> = {}): RawPageData {
  return {
    title: "Title",
    metaDescription: null,
    canonical: null,
    metaRobots: null,
    h1: ["Heading"],
    h2: [],
    imageCount: 0,
    imagesMissingAlt: 0,
    schemaTypes: [],
    links,
    text: "word word word",
    ...overrides,
  };
}

class FakePageFetcher implements PageFetcher {
  constructor(private readonly pages: Record<string, RawPageData>) {}

  async fetch(url: string): Promise<FetchResult> {
    const data = this.pages[url] ?? null;
    return {
      requestedUrl: url,
      finalUrl: url,
      statusCode: data ? 200 : 404,
      responseTimeMs: 5,
      redirectChain: [],
      images: [],
      data,
      error: data ? null : "not found",
    };
  }
}

const SITE: Record<string, RawPageData> = {
  "https://site.test/": page(["/a", "/b", "https://ext.com/"]),
  "https://site.test/a": page(["/b", "/c"]),
  "https://site.test/b": page(["/a"]),
  "https://site.test/c": page(["/a"]),
};

describe("CrawlWebsite", () => {
  it("crawls internal pages breadth-first within the depth limit", async () => {
    const result = await new CrawlWebsite(new FakePageFetcher(SITE)).execute(
      "https://site.test/",
      { maxPages: 50, maxDepth: 2 },
    );

    expect(result.pages.map((p) => p.url).sort()).toEqual([
      "https://site.test/",
      "https://site.test/a",
      "https://site.test/b",
      "https://site.test/c",
    ]);
    expect(result.pageCount).toBe(4);

    const home = result.pages.find((p) => p.url === "https://site.test/")!;
    expect(home.internalLinks.sort()).toEqual([
      "https://site.test/a",
      "https://site.test/b",
    ]);
    expect(home.externalLinks).toEqual(["https://ext.com/"]);
    expect(home.wordCount).toBe(3);
    expect(home.statusCode).toBe(200);
  });

  it("respects maxDepth", async () => {
    const result = await new CrawlWebsite(new FakePageFetcher(SITE)).execute(
      "https://site.test/",
      { maxDepth: 1 },
    );

    expect(result.pages.map((p) => p.url).sort()).toEqual([
      "https://site.test/",
      "https://site.test/a",
      "https://site.test/b",
    ]);
  });

  it("respects maxPages", async () => {
    const result = await new CrawlWebsite(new FakePageFetcher(SITE)).execute(
      "https://site.test/",
      { maxPages: 2 },
    );

    expect(result.pageCount).toBe(2);
  });

  it("records an error for an unreachable page", async () => {
    const result = await new CrawlWebsite(new FakePageFetcher({})).execute(
      "https://site.test/",
    );

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].statusCode).toBe(404);
    expect(result.pages[0].error).toBe("not found");
    expect(result.pages[0].wordCount).toBe(0);
  });
});
