import { readFile } from "node:fs/promises";

import type { AnalysisReport } from "../../application/analysis/dto";
import type { CrawlResult } from "../../domain/crawl/crawl-result";

export type LoadedReport =
  | { kind: "crawl"; crawl: CrawlResult }
  | { kind: "analysis"; analysis: AnalysisReport };

/**
 * Read a JSON report and detect whether it is a raw crawl report or an analysis
 * report, so the audit CLI can accept either.
 */
export async function readReport(path: string): Promise<LoadedReport> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (parsed && Array.isArray(parsed.issues) && parsed.summary) {
    return { kind: "analysis", analysis: parsed as unknown as AnalysisReport };
  }
  if (parsed && Array.isArray(parsed.pages)) {
    return { kind: "crawl", crawl: parsed as unknown as CrawlResult };
  }

  throw new Error(`Unrecognized report format: ${path}`);
}
