/** A loaded image resource and its transfer size (bytes), when known. */
export interface CrawledImage {
  url: string;
  bytes: number | null;
}

/** SEO data collected for a single crawled page. */
export interface PageAudit {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  responseTimeMs: number;
  /** URLs of each redirect hop before the final URL (empty when none). */
  redirectChain: string[];
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  metaRobots: string | null;
  h1: string[];
  h2: string[];
  imageCount: number;
  imagesMissingAlt: number;
  /** Loaded image resources with their sizes, for page-weight analysis. */
  images: CrawledImage[];
  wordCount: number;
  schemaTypes: string[];
  internalLinks: string[];
  externalLinks: string[];
  depth: number;
  error: string | null;
  crawledAt: string;
}
