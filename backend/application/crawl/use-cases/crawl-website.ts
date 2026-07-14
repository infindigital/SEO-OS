import { classifyLinks } from "../../../domain/crawl/links";
import { countWords } from "../../../domain/crawl/text";
import { getHost, normalizeUrl } from "../../../domain/crawl/url";
import type { PageAudit } from "../../../domain/crawl/page-audit";
import type { CrawlOptions, CrawlResult } from "../../../domain/crawl/crawl-result";
import type { PageFetcher } from "../ports/page-fetcher";
import { systemClock, type Clock } from "../ports/clock";

const DEFAULT_OPTIONS: CrawlOptions = { maxPages: 50, maxDepth: 2 };

interface QueueItem {
  url: string;
  depth: number;
}

/**
 * Breadth-first crawl of a website: fetch each page, collect its SEO data, and
 * enqueue newly discovered internal links up to the configured limits.
 */
export class CrawlWebsite {
  constructor(
    private readonly fetcher: PageFetcher,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(
    startUrl: string,
    options: Partial<CrawlOptions> = {},
  ): Promise<CrawlResult> {
    const maxPages = options.maxPages ?? DEFAULT_OPTIONS.maxPages;
    const maxDepth = options.maxDepth ?? DEFAULT_OPTIONS.maxDepth;

    const normalizedStart = normalizeUrl(startUrl);
    if (!normalizedStart) {
      throw new Error(`Invalid start URL: ${startUrl}`);
    }
    const host = getHost(normalizedStart);
    if (!host) {
      throw new Error(`Could not determine host for: ${startUrl}`);
    }

    const startedAt = this.clock.now();
    const visited = new Set<string>();
    const seen = new Set<string>([normalizedStart]);
    const queue: QueueItem[] = [{ url: normalizedStart, depth: 0 }];
    const pages: PageAudit[] = [];

    while (queue.length > 0 && pages.length < maxPages) {
      const { url, depth } = queue.shift()!;
      if (visited.has(url)) {
        continue;
      }
      visited.add(url);

      const result = await this.fetcher.fetch(url);
      const base = result.finalUrl || url;
      const classified = result.data
        ? classifyLinks(result.data.links, host, base)
        : { internal: [], external: [] };

      pages.push({
        url,
        finalUrl: result.finalUrl,
        statusCode: result.statusCode,
        responseTimeMs: result.responseTimeMs,
        title: result.data?.title ?? null,
        metaDescription: result.data?.metaDescription ?? null,
        canonical: result.data?.canonical ?? null,
        metaRobots: result.data?.metaRobots ?? null,
        h1: result.data?.h1 ?? [],
        h2: result.data?.h2 ?? [],
        imageCount: result.data?.imageCount ?? 0,
        imagesMissingAlt: result.data?.imagesMissingAlt ?? 0,
        wordCount: result.data ? countWords(result.data.text) : 0,
        schemaTypes: result.data?.schemaTypes ?? [],
        internalLinks: classified.internal,
        externalLinks: classified.external,
        depth,
        error: result.error,
        crawledAt: this.clock.now().toISOString(),
      });

      if (depth < maxDepth && result.data) {
        for (const link of classified.internal) {
          if (!seen.has(link)) {
            seen.add(link);
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    }

    const finishedAt = this.clock.now();

    return {
      startUrl: normalizedStart,
      host,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      options: { maxPages, maxDepth },
      pageCount: pages.length,
      pages,
    };
  }
}
