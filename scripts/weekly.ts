/**
 * Weekly SEO run. For each configured site: crawl it, compare against the
 * client's previous crawl (updating memory), generate a technical audit, and
 * write stable per-client reports under reports/scheduled/<clientId>/.
 *
 *   npm run weekly -- [automations/scheduled-crawls.json]
 *
 * Config: a JSON array of { clientId, url, maxPages?, maxDepth? }.
 * Requires PLAYWRIGHT_CHROMIUM_EXECUTABLE to point at a Chromium binary.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CrawlWebsite } from "../backend/application/crawl/use-cases/crawl-website";
import { PlaywrightPageFetcher } from "../backend/infrastructure/crawl/playwright-page-fetcher";
import { AnalyzeCrawl } from "../backend/application/analysis/use-cases/analyze-crawl";
import { GenerateTechnicalAudit } from "../backend/application/audit/use-cases/generate-technical-audit";
import { renderAuditMarkdown } from "../backend/infrastructure/audit/render-audit-markdown";
import { RecordCrawlComparison } from "../backend/application/client-memory/use-cases/record-crawl-comparison";
import { FileClientMemoryStore } from "../backend/infrastructure/client-memory/file-client-memory-store";

interface SiteConfig {
  clientId: string;
  url: string;
  maxPages?: number;
  maxDepth?: number;
}

function safeId(value: string): string {
  return value.replace(/[^a-z0-9._-]/gi, "_");
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  const configPath = process.argv[2] ?? "automations/scheduled-crawls.json";

  let sites: SiteConfig[];
  try {
    sites = JSON.parse(await readFile(configPath, "utf8")) as SiteConfig[];
  } catch (error) {
    console.error(`Could not read config ${configPath}:`, error);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(sites) || sites.length === 0) {
    console.log(`No sites configured in ${configPath}. Nothing to do.`);
    return;
  }

  const fetcher = new PlaywrightPageFetcher({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  await fetcher.init();
  const memoryStore = new FileClientMemoryStore("clients");

  try {
    for (const site of sites) {
      if (!site.clientId || !site.url) {
        console.warn("Skipping invalid config entry:", site);
        continue;
      }
      console.log(`\n=== ${site.clientId} — ${site.url} ===`);

      const crawl = await new CrawlWebsite(fetcher).execute(site.url, {
        maxPages: site.maxPages ?? 50,
        maxDepth: site.maxDepth ?? 2,
      });
      console.log(`Crawled ${crawl.pageCount} page(s).`);

      const analysis = new AnalyzeCrawl().execute(crawl);

      const comparison = await new RecordCrawlComparison(memoryStore).execute({
        clientId: site.clientId,
        analysis,
      });
      console.log(
        `Compared: new ${comparison.counts.newIssues}, resolved ${comparison.counts.resolvedIssues}, ` +
          `remaining ${comparison.counts.remainingIssues}, improvement ${comparison.improvementScore}.`,
      );

      const audit = new GenerateTechnicalAudit().execute(analysis);
      console.log(`Generated ${audit.summary.totalTasks} task(s).`);

      const dir = join("reports", "scheduled", safeId(site.clientId));
      await mkdir(dir, { recursive: true });
      await writeJson(join(dir, "crawl.json"), crawl);
      await writeJson(join(dir, "analysis.json"), analysis);
      await writeJson(join(dir, "comparison.json"), comparison);
      await writeJson(join(dir, "audit.json"), audit);
      await writeFile(
        join(dir, "audit.md"),
        `${renderAuditMarkdown(audit)}\n`,
        "utf8",
      );
      console.log(`Wrote reports to ${dir}/`);
    }
    console.log("\nWeekly SEO run complete.");
  } finally {
    await fetcher.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
