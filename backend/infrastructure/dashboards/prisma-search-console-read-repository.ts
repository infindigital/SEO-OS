import type { PrismaClient } from "@prisma/client";
import type { ConnectionStatus } from "@backend/domain/search-console/connection";
import type { SearchDimension } from "@backend/domain/search-console/search-dimension";
import type {
  AggregatedRow,
  ClientMetricSummary,
  ConnectionRef,
  CoverageCount,
  MetricTotals,
  SearchConsoleReadRepository,
} from "@backend/application/dashboards/ports/search-console-read-repository";

/** Prisma aggregations behind {@link SearchConsoleReadRepository}. */
export class PrismaSearchConsoleReadRepository
  implements SearchConsoleReadRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async getClientMetricSummaries(): Promise<ClientMetricSummary[]> {
    const connections = await this.prisma.searchConsoleConnection.findMany();
    if (connections.length === 0) {
      return [];
    }

    const grouped = await this.prisma.searchAnalyticsRow.groupBy({
      by: ["connectionId"],
      where: { dimension: "QUERY" },
      _sum: { clicks: true, impressions: true },
    });
    const sums = new Map(grouped.map((g) => [g.connectionId, g._sum]));

    return connections.map((connection) => {
      const sum = sums.get(connection.id);
      return {
        clientId: connection.clientId,
        siteUrl: connection.siteUrl,
        status: connection.status as ConnectionStatus,
        lastSyncedAt: connection.lastSyncedAt,
        clicks: sum?.clicks ?? 0,
        impressions: sum?.impressions ?? 0,
      };
    });
  }

  async getPrimaryConnection(clientId: string): Promise<ConnectionRef | null> {
    const connection = await this.prisma.searchConsoleConnection.findFirst({
      where: { clientId },
      orderBy: { createdAt: "asc" },
    });
    if (!connection) {
      return null;
    }
    return {
      id: connection.id,
      siteUrl: connection.siteUrl,
      status: connection.status as ConnectionStatus,
      lastSyncedAt: connection.lastSyncedAt,
    };
  }

  async totals(
    connectionId: string,
    dimension: SearchDimension,
  ): Promise<MetricTotals> {
    const result = await this.prisma.searchAnalyticsRow.aggregate({
      where: { connectionId, dimension },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true },
    });
    return {
      clicks: result._sum.clicks ?? 0,
      impressions: result._sum.impressions ?? 0,
      position: result._avg.position ?? 0,
    };
  }

  async topRows(
    connectionId: string,
    dimension: SearchDimension,
    limit: number,
  ): Promise<AggregatedRow[]> {
    const grouped = await this.prisma.searchAnalyticsRow.groupBy({
      by: ["keyValue"],
      where: { connectionId, dimension },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true },
      orderBy: { _sum: { clicks: "desc" } },
      take: limit,
    });
    return grouped.map((row) => ({
      key: row.keyValue,
      clicks: row._sum.clicks ?? 0,
      impressions: row._sum.impressions ?? 0,
      position: row._avg.position ?? 0,
    }));
  }

  async keywordCount(connectionId: string): Promise<number> {
    const grouped = await this.prisma.searchAnalyticsRow.groupBy({
      by: ["keyValue"],
      where: { connectionId, dimension: "QUERY" },
    });
    return grouped.length;
  }

  async coverageBreakdown(connectionId: string): Promise<CoverageCount[]> {
    const grouped = await this.prisma.pageCoverage.groupBy({
      by: ["coverageState"],
      where: { connectionId },
      _count: { _all: true },
    });
    return grouped.map((row) => ({
      state: row.coverageState,
      count: row._count._all,
    }));
  }
}
