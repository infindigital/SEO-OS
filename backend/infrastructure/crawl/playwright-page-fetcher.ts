import { chromium, type Browser } from "playwright-core";

import type {
  FetchResult,
  PageFetcher,
  RawPageData,
} from "../../application/crawl/ports/page-fetcher";

export interface PlaywrightPageFetcherOptions {
  /** Path to the Chromium executable (required for playwright-core). */
  executablePath?: string;
  /** Navigation timeout in milliseconds. */
  timeoutMs?: number;
  userAgent?: string;
}

const DEFAULT_USER_AGENT =
  "InfinDigital-SEO-OS-Crawler/1.0 (+https://infindigital.net)";

/**
 * {@link PageFetcher} backed by a headless Chromium browser via Playwright.
 * Call {@link init} before fetching and {@link close} when done.
 */
export class PlaywrightPageFetcher implements PageFetcher {
  private browser: Browser | null = null;
  private readonly executablePath?: string;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: PlaywrightPageFetcherOptions = {}) {
    this.executablePath = options.executablePath;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  async init(): Promise<void> {
    if (this.browser) {
      return;
    }
    this.browser = await chromium.launch({
      headless: true,
      executablePath: this.executablePath,
    });
  }

  async fetch(url: string): Promise<FetchResult> {
    if (!this.browser) {
      throw new Error(
        "PlaywrightPageFetcher is not initialized. Call init() first.",
      );
    }

    const context = await this.browser.newContext({
      userAgent: this.userAgent,
    });
    const page = await context.newPage();
    const startedAt = Date.now();

    let statusCode: number | null = null;
    let finalUrl = url;
    let data: RawPageData | null = null;
    let error: string | null = null;

    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: this.timeoutMs,
      });
      statusCode = response ? response.status() : null;
      finalUrl = page.url();
      // Passed as an anonymous inline arrow with no named inner functions so
      // bundlers (esbuild/tsx) don't inject helpers (e.g. __name) that would be
      // undefined once the function is serialized into the browser context.
      data = await page.evaluate((): RawPageData => {
        const title = document.querySelector("title")?.textContent?.trim() ?? null;
        const metaDescription =
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content")
            ?.trim() ?? null;
        const canonicalEl = document.querySelector<HTMLLinkElement>(
          'link[rel="canonical"]',
        );
        const canonical = canonicalEl ? canonicalEl.href : null;
        const metaRobots =
          document
            .querySelector('meta[name="robots"]')
            ?.getAttribute("content")
            ?.trim() ?? null;

        const h1 = Array.from(document.querySelectorAll("h1"))
          .map((el) => (el.textContent ?? "").trim())
          .filter((value) => value.length > 0);
        const h2 = Array.from(document.querySelectorAll("h2"))
          .map((el) => (el.textContent ?? "").trim())
          .filter((value) => value.length > 0);

        const images = Array.from(document.querySelectorAll("img"));
        const imagesMissingAlt = images.filter((img) => {
          const alt = img.getAttribute("alt");
          return alt === null || alt.trim().length === 0;
        }).length;

        const schemaTypes = new Set<string>();
        const stack: unknown[] = [];
        for (const script of Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        )) {
          try {
            stack.push(JSON.parse(script.textContent ?? "null"));
          } catch {
            // Ignore malformed JSON-LD.
          }
        }
        while (stack.length > 0) {
          const node = stack.pop();
          if (!node || typeof node !== "object") {
            continue;
          }
          if (Array.isArray(node)) {
            for (const child of node) {
              stack.push(child);
            }
            continue;
          }
          const record = node as Record<string, unknown>;
          const type = record["@type"];
          if (typeof type === "string") {
            schemaTypes.add(type);
          } else if (Array.isArray(type)) {
            for (const value of type) {
              if (typeof value === "string") {
                schemaTypes.add(value);
              }
            }
          }
          const graph = record["@graph"];
          if (Array.isArray(graph)) {
            for (const child of graph) {
              stack.push(child);
            }
          }
        }

        const links = Array.from(
          document.querySelectorAll<HTMLAnchorElement>("a[href]"),
        )
          .map((anchor) => anchor.href)
          .filter((href) => href.startsWith("http"));

        const text = document.body ? document.body.innerText : "";

        return {
          title,
          metaDescription,
          canonical,
          metaRobots,
          h1,
          h2,
          imageCount: images.length,
          imagesMissingAlt,
          schemaTypes: Array.from(schemaTypes),
          links: Array.from(new Set(links)),
          text,
        };
      });
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    } finally {
      await context.close();
    }

    return {
      requestedUrl: url,
      finalUrl,
      statusCode,
      responseTimeMs: Date.now() - startedAt,
      data,
      error,
    };
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }
}
