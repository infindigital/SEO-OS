import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { CrawlResult } from "../../domain/crawl/crawl-result";

/**
 * Write a crawl result to `<directory>/crawl-<host>-<timestamp>.json` and return
 * the file path.
 */
export async function saveCrawlReport(
  result: CrawlResult,
  directory = "reports",
): Promise<string> {
  await mkdir(directory, { recursive: true });
  const safeHost = result.host.replace(/[^a-z0-9.-]/gi, "_");
  const stamp = result.startedAt.replace(/[:.]/g, "-");
  const path = join(directory, `crawl-${safeHost}-${stamp}.json`);
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return path;
}
