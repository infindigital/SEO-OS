import type { CrawledImage } from "../../../domain/crawl/page-audit";

/** Raw SEO data extracted from a page's DOM (before link classification). */
export interface RawPageData {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  metaRobots: string | null;
  h1: string[];
  h2: string[];
  imageCount: number;
  imagesMissingAlt: number;
  schemaTypes: string[];
  /** Absolute http(s) hrefs found on the page. */
  links: string[];
  /** Visible text content, used to compute the word count. */
  text: string;
}

export interface FetchResult {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number | null;
  responseTimeMs: number;
  redirectChain: string[];
  images: CrawledImage[];
  data: RawPageData | null;
  error: string | null;
}

/**
 * Port for fetching and extracting a single page. Implemented in the
 * infrastructure layer (Playwright); the crawl use case depends only on this.
 */
export interface PageFetcher {
  fetch(url: string): Promise<FetchResult>;
}
