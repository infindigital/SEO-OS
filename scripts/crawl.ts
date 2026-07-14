/**
 * SEO crawler CLI. Crawls a website with Playwright and saves the result as
 * JSON under `reports/`.
 *
 *   npm run crawl -- https://example.com [--max-pages=50] [--max-depth=2]
 *
 * Requires PLAYWRIGHT_CHROMIUM_EXECUTABLE to point at a Chromium binary.
 */
import { CrawlWebsite } from "../backend/application/crawl/use-cases/crawl-website";
import { PlaywrightPageFetcher } from "../backend/infrastructure/crawl/playwright-page-fetcher";
import { saveCrawlReport } from "../backend/infrastructure/crawl/save-crawl-report";

function readNumberArg(name: string, fallback: number): number {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  if (!arg) {
    return fallback;
  }
  const parsed = Number(arg.split("=")[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

async function main(): Promise<void> {
  const startUrl = process.argv[2];
  if (!startUrl || startUrl.startsWith("--")) {
    console.error(
      "Usage: npm run crawl -- <url> [--max-pages=50] [--max-depth=2]",
    );
    process.exitCode = 1;
    return;
  }

  const maxPages = readNumberArg("--max-pages", 50);
  const maxDepth = readNumberArg("--max-depth", 2);
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

  const fetcher = new PlaywrightPageFetcher({ executablePath });
  await fetcher.init();

  try {
    const crawler = new CrawlWebsite(fetcher);
    console.log(
      `Crawling ${startUrl} (max ${maxPages} pages, depth ${maxDepth})…`,
    );
    const result = await crawler.execute(startUrl, { maxPages, maxDepth });
    const path = await saveCrawlReport(result, "reports");
    console.log(
      `Done. Crawled ${result.pageCount} page(s) in ${result.durationMs}ms.`,
    );
    console.log(`Report saved to ${path}`);
  } finally {
    await fetcher.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
