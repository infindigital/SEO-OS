import { readFile } from "node:fs/promises";

import type { CrawlResult } from "../../domain/crawl/crawl-result";

/** Read and parse a crawl report JSON file produced by the crawler. */
export async function readCrawlReport(path: string): Promise<CrawlResult> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as CrawlResult;

  if (!parsed || !Array.isArray(parsed.pages)) {
    throw new Error(`Invalid crawl report (missing "pages"): ${path}`);
  }

  return parsed;
}
