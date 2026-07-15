import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { AnalysisReport } from "../../application/analysis/dto";

/**
 * Write an analysis report to `<directory>/analysis-<host>-<timestamp>.json`
 * and return the file path.
 */
export async function saveAnalysisReport(
  report: AnalysisReport,
  directory = "reports",
): Promise<string> {
  await mkdir(directory, { recursive: true });
  const safeHost = report.host.replace(/[^a-z0-9.-]/gi, "_");
  const stamp = report.analyzedAt.replace(/[:.]/g, "-");
  const path = join(directory, `analysis-${safeHost}-${stamp}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}
