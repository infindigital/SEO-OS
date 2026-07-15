import {
  countIssues,
  type ClientMemory,
} from "../../../domain/client-memory/client-memory";
import { compareIssues } from "../../../domain/comparison/compare-issues";
import type { AnalysisReport } from "../../analysis/dto";
import { systemClock, type Clock } from "../../crawl/ports/clock";
import type { ClientMemoryStore } from "../ports/client-memory-store";
import type { CrawlComparisonReport } from "../dto";

export interface RecordCrawlComparisonInput {
  clientId: string;
  analysis: AnalysisReport;
}

/**
 * Run when a crawl finishes: compare the new analysis against the client's
 * remembered previous crawl, then update the client's memory (latest issues +
 * history snapshot).
 */
export class RecordCrawlComparison {
  constructor(
    private readonly store: ClientMemoryStore,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(input: RecordCrawlComparisonInput): Promise<CrawlComparisonReport> {
    const { clientId, analysis } = input;
    const now = this.clock.now().toISOString();

    const memory = await this.store.load(clientId);
    const isFirstRun = memory === null;
    const previousIssues = memory?.currentIssues ?? [];

    const comparison = compareIssues(previousIssues, analysis.issues);
    // On the very first crawl there is no baseline, so the score is neutral.
    const improvementScore = isFirstRun ? 0 : comparison.improvementScore;

    const updated: ClientMemory = {
      clientId,
      host: analysis.host,
      startUrl: analysis.startUrl,
      firstSeenAt: memory?.firstSeenAt ?? now,
      lastCrawlAt: now,
      currentIssues: analysis.issues,
      history: [
        ...(memory?.history ?? []),
        {
          comparedAt: now,
          analyzedAt: analysis.analyzedAt,
          issueCounts: countIssues(analysis.issues),
          improvementScore,
          newIssues: comparison.counts.newIssues,
          resolvedIssues: comparison.counts.resolvedIssues,
          remainingIssues: comparison.counts.remainingIssues,
        },
      ],
    };

    await this.store.save(updated);

    return {
      clientId,
      host: analysis.host,
      startUrl: analysis.startUrl,
      comparedAt: now,
      isFirstRun,
      improvementScore,
      counts: comparison.counts,
      newIssues: comparison.newIssues,
      resolvedIssues: comparison.resolvedIssues,
      remainingIssues: comparison.remainingIssues,
    };
  }
}
