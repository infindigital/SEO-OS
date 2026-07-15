/**
 * Crawl analyzer CLI. Reads a crawl JSON report, runs rule-based SEO analysis,
 * and saves a JSON issue report under `reports/`.
 *
 *   npm run analyze -- reports/crawl-example.com-....json [--thin-content=250] [--large-image-kb=100]
 */
import { AnalyzeCrawl } from "../backend/application/analysis/use-cases/analyze-crawl";
import { readCrawlReport } from "../backend/infrastructure/analysis/read-crawl-report";
import { saveAnalysisReport } from "../backend/infrastructure/analysis/save-analysis-report";

function readNumberArg(name: string, fallback: number): number {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  if (!arg) {
    return fallback;
  }
  const parsed = Number(arg.split("=")[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input || input.startsWith("--")) {
    console.error(
      "Usage: npm run analyze -- <crawl.json> [--thin-content=250] [--large-image-kb=100]",
    );
    process.exitCode = 1;
    return;
  }

  const thinContentWordCount = readNumberArg("--thin-content", 250);
  const largeImageKb = readNumberArg("--large-image-kb", 100);

  const crawl = await readCrawlReport(input);
  const report = new AnalyzeCrawl().execute(crawl, {
    thresholds: {
      thinContentWordCount,
      largeImageBytes: largeImageKb * 1024,
    },
  });
  const path = await saveAnalysisReport(report, "reports");

  const { summary } = report;
  console.log(
    `Analyzed ${summary.totalPages} page(s): ${summary.totalIssues} issue(s) ` +
      `(${summary.bySeverity.error} errors, ${summary.bySeverity.warning} warnings, ${summary.bySeverity.notice} notices).`,
  );
  console.log(`Report saved to ${path}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
