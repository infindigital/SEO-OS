/**
 * Technical audit CLI. Reads a crawl report (or an analysis report), generates
 * a prioritized set of developer tasks, and saves both JSON and Markdown under
 * `reports/`.
 *
 *   npm run audit -- reports/crawl-example.com-....json
 */
import { AnalyzeCrawl } from "../backend/application/analysis/use-cases/analyze-crawl";
import { GenerateTechnicalAudit } from "../backend/application/audit/use-cases/generate-technical-audit";
import { readReport } from "../backend/infrastructure/audit/read-report";
import { saveAuditReport } from "../backend/infrastructure/audit/save-audit-report";

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input || input.startsWith("--")) {
    console.error("Usage: npm run audit -- <crawl.json | analysis.json>");
    process.exitCode = 1;
    return;
  }

  const loaded = await readReport(input);
  const analysis =
    loaded.kind === "analysis"
      ? loaded.analysis
      : new AnalyzeCrawl().execute(loaded.crawl);

  const audit = new GenerateTechnicalAudit().execute(analysis);
  const { jsonPath, markdownPath } = await saveAuditReport(audit, "reports");

  const { summary } = audit;
  console.log(
    `Generated ${summary.totalTasks} task(s) from ${summary.totalIssues} issue(s). ` +
      `Estimated effort: ${summary.estimatedTime} ` +
      `(${summary.byPriority.critical} critical, ${summary.byPriority.high} high, ` +
      `${summary.byPriority.medium} medium, ${summary.byPriority.low} low).`,
  );
  console.log(`JSON:     ${jsonPath}`);
  console.log(`Markdown: ${markdownPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
