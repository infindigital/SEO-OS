import { analyzeCrawl } from "../../../domain/analysis/analyze-crawl";
import {
  DEFAULT_THRESHOLDS,
  type AnalysisThresholds,
} from "../../../domain/analysis/thresholds";
import type { CrawlResult } from "../../../domain/crawl/crawl-result";
import { systemClock, type Clock } from "../../crawl/ports/clock";
import type { AnalysisReport } from "../dto";

export interface AnalyzeCrawlOptions {
  thresholds?: Partial<AnalysisThresholds>;
}

/**
 * Analyze a crawl result and produce a report. Resolves thresholds and stamps
 * the report with the analysis time; the SEO logic itself lives in the domain.
 */
export class AnalyzeCrawl {
  constructor(private readonly clock: Clock = systemClock) {}

  execute(crawl: CrawlResult, options: AnalyzeCrawlOptions = {}): AnalysisReport {
    const thresholds: AnalysisThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...options.thresholds,
    };
    const { issues, summary } = analyzeCrawl(crawl, thresholds);

    return {
      startUrl: crawl.startUrl,
      host: crawl.host,
      analyzedAt: this.clock.now().toISOString(),
      thresholds,
      summary,
      issues,
    };
  }
}
