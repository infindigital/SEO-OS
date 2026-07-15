import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { CrawlComparisonReport } from "../../application/client-memory/dto";

/**
 * Write a crawl comparison report to
 * `<directory>/comparison-<clientId>-<timestamp>.json` and return the path.
 */
export async function saveComparisonReport(
  report: CrawlComparisonReport,
  directory = "reports",
): Promise<string> {
  await mkdir(directory, { recursive: true });
  const safeClient = report.clientId.replace(/[^a-z0-9._-]/gi, "_");
  const stamp = report.comparedAt.replace(/[:.]/g, "-");
  const path = join(directory, `comparison-${safeClient}-${stamp}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}
