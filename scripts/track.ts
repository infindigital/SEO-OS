/**
 * Track SEO progress for a client. Run when a crawl finishes: it analyzes the
 * crawl (if needed), compares it against the client's previous crawl, updates
 * the client's memory, and writes a comparison report.
 *
 *   npm run track -- <clientId> <crawl.json | analysis.json>
 */
import { AnalyzeCrawl } from "../backend/application/analysis/use-cases/analyze-crawl";
import { RecordCrawlComparison } from "../backend/application/client-memory/use-cases/record-crawl-comparison";
import { readReport } from "../backend/infrastructure/audit/read-report";
import { FileClientMemoryStore } from "../backend/infrastructure/client-memory/file-client-memory-store";
import { saveComparisonReport } from "../backend/infrastructure/client-memory/save-comparison-report";

async function main(): Promise<void> {
  const clientId = process.argv[2];
  const input = process.argv[3];
  if (!clientId || !input || clientId.startsWith("--")) {
    console.error(
      "Usage: npm run track -- <clientId> <crawl.json | analysis.json>",
    );
    process.exitCode = 1;
    return;
  }

  const loaded = await readReport(input);
  const analysis =
    loaded.kind === "analysis"
      ? loaded.analysis
      : new AnalyzeCrawl().execute(loaded.crawl);

  const store = new FileClientMemoryStore("clients");
  const report = await new RecordCrawlComparison(store).execute({
    clientId,
    analysis,
  });
  const reportPath = await saveComparisonReport(report, "reports");

  if (report.isFirstRun) {
    console.log(
      `First crawl recorded for "${clientId}": ${report.counts.currentTotal} issue(s) baselined.`,
    );
  } else {
    console.log(
      `Client "${clientId}" — improvement score ${report.improvementScore}. ` +
        `New: ${report.counts.newIssues}, Resolved: ${report.counts.resolvedIssues}, ` +
        `Remaining: ${report.counts.remainingIssues}.`,
    );
  }
  console.log(`Client memory: clients/${clientId}/memory.json`);
  console.log(`Comparison report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
