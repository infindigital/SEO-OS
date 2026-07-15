import { computeCtr } from "@backend/domain/search-console/metrics";
import type { SearchDimension } from "@backend/domain/search-console/search-dimension";
import { systemClock, type Clock } from "@backend/application/crawl/ports/clock";
import type {
  GscAnalyticsRow,
  SearchConsoleGateway,
} from "../ports/search-console-gateway";
import type { SearchConsoleGatewayFactory } from "../ports/search-console-gateway-factory";
import type {
  AnalyticsRowInput,
  CoverageInput,
  SearchConsoleRepository,
} from "../ports/search-console-repository";
import type { SyncOptions, SyncResult } from "../dto";
import {
  SearchConsoleConnectionNotFoundError,
  SearchConsoleNotConnectedError,
} from "../errors";
import { defaultDateRange } from "../date-range";

const DEFAULT_ROW_LIMIT = 1000;
const DEFAULT_COVERAGE_LIMIT = 25;

/**
 * Sync one connection: pull query and page analytics for the reporting window,
 * pull coverage for the top pages, and persist everything.
 */
export class SyncSearchConsole {
  constructor(
    private readonly repository: SearchConsoleRepository,
    private readonly gatewayFactory: SearchConsoleGatewayFactory,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(
    connectionId: string,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const connection = await this.repository.getConnection(connectionId);
    if (!connection) {
      throw new SearchConsoleConnectionNotFoundError(connectionId);
    }
    if (!connection.refreshToken) {
      throw new SearchConsoleNotConnectedError(connectionId);
    }

    const gateway = this.gatewayFactory.create({
      siteUrl: connection.siteUrl,
      refreshToken: connection.refreshToken,
    });

    const range =
      options.startDate && options.endDate
        ? { startDate: options.startDate, endDate: options.endDate }
        : defaultDateRange(this.clock.now());
    const rowLimit = options.rowLimit ?? DEFAULT_ROW_LIMIT;

    const queryRows = await gateway.fetchAnalytics({
      siteUrl: connection.siteUrl,
      ...range,
      dimension: "QUERY",
      rowLimit,
    });
    const pageRows = await gateway.fetchAnalytics({
      siteUrl: connection.siteUrl,
      ...range,
      dimension: "PAGE",
      rowLimit,
    });

    const savedQueries = await this.repository.upsertAnalyticsRows(
      connection.id,
      queryRows.map((row) => toAnalyticsInput("QUERY", row)),
    );
    const savedPages = await this.repository.upsertAnalyticsRows(
      connection.id,
      pageRows.map((row) => toAnalyticsInput("PAGE", row)),
    );

    const coverage = await this.collectCoverage(
      gateway,
      connection.siteUrl,
      pageRows,
      options.coverageLimit ?? DEFAULT_COVERAGE_LIMIT,
    );
    const savedCoverage = await this.repository.upsertCoverage(
      connection.id,
      coverage,
    );

    await this.repository.markSynced(connection.id, this.clock.now());

    return {
      connectionId: connection.id,
      siteUrl: connection.siteUrl,
      queryRows: savedQueries,
      pageRows: savedPages,
      coverageRows: savedCoverage,
    };
  }

  private async collectCoverage(
    gateway: SearchConsoleGateway,
    siteUrl: string,
    pageRows: GscAnalyticsRow[],
    limit: number,
  ): Promise<CoverageInput[]> {
    const topPages = [
      ...new Set(
        [...pageRows]
          .sort((a, b) => b.clicks - a.clicks)
          .map((row) => row.key),
      ),
    ].slice(0, limit);

    const coverage: CoverageInput[] = [];
    for (const page of topPages) {
      try {
        const row = await gateway.inspectUrl(siteUrl, page);
        coverage.push({
          page: row.page,
          coverageState: row.coverageState,
          verdict: row.verdict,
          lastCrawledAt: row.lastCrawledAt ? new Date(row.lastCrawledAt) : null,
        });
      } catch {
        // Skip individual inspection failures (e.g. rate limits) and continue.
      }
    }
    return coverage;
  }
}

function toAnalyticsInput(
  dimension: SearchDimension,
  row: GscAnalyticsRow,
): AnalyticsRowInput {
  return {
    dimension,
    key: row.key,
    date: new Date(`${row.date}T00:00:00.000Z`),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: Number.isFinite(row.ctr)
      ? row.ctr
      : computeCtr(row.clicks, row.impressions),
    position: row.position,
  };
}
