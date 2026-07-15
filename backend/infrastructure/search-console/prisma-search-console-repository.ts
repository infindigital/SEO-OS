import type { PrismaClient, SearchConsoleConnection as ConnectionRecord } from "@prisma/client";
import type {
  ConnectionStatus,
  SearchConsoleConnection,
} from "@backend/domain/search-console/connection";
import type {
  AnalyticsRowInput,
  CoverageInput,
  SearchConsoleRepository,
  UpsertConnectionInput,
} from "@backend/application/search-console/ports/search-console-repository";

function toConnection(record: ConnectionRecord): SearchConsoleConnection {
  return {
    id: record.id,
    clientId: record.clientId,
    siteUrl: record.siteUrl,
    refreshToken: record.refreshToken,
    status: record.status as ConnectionStatus,
    lastSyncedAt: record.lastSyncedAt,
  };
}

/** Prisma-backed implementation of the {@link SearchConsoleRepository} port. */
export class PrismaSearchConsoleRepository implements SearchConsoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listConnections(): Promise<SearchConsoleConnection[]> {
    const records = await this.prisma.searchConsoleConnection.findMany({
      where: { status: "CONNECTED", refreshToken: { not: null } },
    });
    return records.map(toConnection);
  }

  async getConnection(id: string): Promise<SearchConsoleConnection | null> {
    const record = await this.prisma.searchConsoleConnection.findUnique({
      where: { id },
    });
    return record ? toConnection(record) : null;
  }

  async upsertConnection(
    input: UpsertConnectionInput,
  ): Promise<SearchConsoleConnection> {
    const record = await this.prisma.searchConsoleConnection.upsert({
      where: {
        clientId_siteUrl: { clientId: input.clientId, siteUrl: input.siteUrl },
      },
      update: { refreshToken: input.refreshToken, status: "CONNECTED" },
      create: {
        clientId: input.clientId,
        siteUrl: input.siteUrl,
        refreshToken: input.refreshToken,
        status: "CONNECTED",
      },
    });
    return toConnection(record);
  }

  async upsertAnalyticsRows(
    connectionId: string,
    rows: AnalyticsRowInput[],
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.searchAnalyticsRow.upsert({
          where: {
            connectionId_dimension_keyValue_date: {
              connectionId,
              dimension: row.dimension,
              keyValue: row.key,
              date: row.date,
            },
          },
          update: {
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          },
          create: {
            connectionId,
            dimension: row.dimension,
            keyValue: row.key,
            date: row.date,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          },
        }),
      ),
    );
    return rows.length;
  }

  async upsertCoverage(
    connectionId: string,
    rows: CoverageInput[],
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.pageCoverage.upsert({
          where: { connectionId_page: { connectionId, page: row.page } },
          update: {
            coverageState: row.coverageState,
            verdict: row.verdict,
            lastCrawledAt: row.lastCrawledAt,
          },
          create: {
            connectionId,
            page: row.page,
            coverageState: row.coverageState,
            verdict: row.verdict,
            lastCrawledAt: row.lastCrawledAt,
          },
        }),
      ),
    );
    return rows.length;
  }

  async markSynced(connectionId: string, at: Date): Promise<void> {
    await this.prisma.searchConsoleConnection.update({
      where: { id: connectionId },
      data: { lastSyncedAt: at, status: "CONNECTED" },
    });
  }

  async setStatus(
    connectionId: string,
    status: ConnectionStatus,
  ): Promise<void> {
    await this.prisma.searchConsoleConnection.update({
      where: { id: connectionId },
      data: { status },
    });
  }
}
