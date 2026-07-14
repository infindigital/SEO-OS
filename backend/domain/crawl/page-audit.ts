/** SEO data collected for a single crawled page. */
export interface PageAudit {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  responseTimeMs: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  metaRobots: string | null;
  h1: string[];
  h2: string[];
  imageCount: number;
  imagesMissingAlt: number;
  wordCount: number;
  schemaTypes: string[];
  internalLinks: string[];
  externalLinks: string[];
  depth: number;
  error: string | null;
  crawledAt: string;
}
