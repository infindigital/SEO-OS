import { computeCtr } from "@backend/domain/search-console/metrics";
import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import { toClientView } from "@backend/application/client/mapper";
import type { SearchConsoleReadRepository } from "../ports/search-console-read-repository";
import type { AgencyClientRow, AgencyOverview } from "../dto";

/** Agency-wide portfolio overview: every client with its Search Console totals. */
export class GetAgencyOverview {
  constructor(
    private readonly clients: ClientRepository,
    private readonly read: SearchConsoleReadRepository,
  ) {}

  async execute(): Promise<AgencyOverview> {
    const clients = await this.clients.list({});
    const summaries = await this.read.getClientMetricSummaries();
    const byClient = new Map(summaries.map((s) => [s.clientId, s]));

    const rows: AgencyClientRow[] = clients.map((client) => {
      const summary = byClient.get(client.id);
      return {
        client: toClientView(client),
        gsc: summary
          ? {
              siteUrl: summary.siteUrl,
              status: summary.status,
              lastSyncedAt: summary.lastSyncedAt?.toISOString() ?? null,
              clicks: summary.clicks,
              impressions: summary.impressions,
              ctr: computeCtr(summary.clicks, summary.impressions),
            }
          : null,
      };
    });

    const clicks = summaries.reduce((sum, s) => sum + s.clicks, 0);
    const impressions = summaries.reduce((sum, s) => sum + s.impressions, 0);

    return {
      clientCount: clients.length,
      connectedCount: summaries.length,
      totals: { clicks, impressions, ctr: computeCtr(clicks, impressions) },
      clients: rows,
    };
  }
}
