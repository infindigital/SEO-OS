import { computeCtr } from "@backend/domain/search-console/metrics";
import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import { toClientView } from "@backend/application/client/mapper";
import type {
  AggregatedRow,
  SearchConsoleReadRepository,
} from "../ports/search-console-read-repository";
import type { AnalyticsRowView, ClientDashboard } from "../dto";

/** Per-client dashboard: its Search Console performance and index coverage. */
export class GetClientDashboard {
  constructor(
    private readonly clients: ClientRepository,
    private readonly read: SearchConsoleReadRepository,
  ) {}

  async execute(clientId: string): Promise<ClientDashboard | null> {
    const client = await this.clients.findById(clientId);
    if (!client) {
      return null;
    }

    const connection = await this.read.getPrimaryConnection(clientId);
    if (!connection) {
      return {
        client: toClientView(client),
        connection: null,
        totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        topQueries: [],
        topPages: [],
        coverage: [],
      };
    }

    const [totals, topQueries, topPages, coverage] = await Promise.all([
      this.read.totals(connection.id, "QUERY"),
      this.read.topRows(connection.id, "QUERY", 10),
      this.read.topRows(connection.id, "PAGE", 10),
      this.read.coverageBreakdown(connection.id),
    ]);

    return {
      client: toClientView(client),
      connection: {
        siteUrl: connection.siteUrl,
        status: connection.status,
        lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
      },
      totals: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: computeCtr(totals.clicks, totals.impressions),
        position: totals.position,
      },
      topQueries: topQueries.map(toRowView),
      topPages: topPages.map(toRowView),
      coverage,
    };
  }
}

function toRowView(row: AggregatedRow): AnalyticsRowView {
  return {
    key: row.key,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: computeCtr(row.clicks, row.impressions),
    position: row.position,
  };
}
