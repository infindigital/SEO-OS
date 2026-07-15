import type { ClientRepository } from "../ports/client-repository";
import type { ClientPortfolioSummary } from "../dto";

const AUDIT_STALE_DAYS = 30;

/** Portfolio KPIs for the client-management dashboard cards (active clients). */
export class GetClientPortfolioSummary {
  constructor(private readonly clients: ClientRepository) {}

  async execute(now: Date = new Date()): Promise<ClientPortfolioSummary> {
    const clients = await this.clients.list({});

    const totalMonthlyRetainer = clients.reduce(
      (sum, client) => sum + (client.monthlyRetainer ?? 0),
      0,
    );

    const scored = clients.filter((client) => client.seoScore !== null);
    const averageSeoScore =
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, client) => sum + (client.seoScore ?? 0), 0) /
              scored.length,
          )
        : null;

    const staleThreshold = now.getTime() - AUDIT_STALE_DAYS * 86_400_000;
    const clientsNeedingAudit = clients.filter(
      (client) =>
        client.lastAuditAt === null ||
        client.lastAuditAt.getTime() < staleThreshold,
    ).length;

    const activeClients = clients.filter(
      (client) => client.status === "ACTIVE",
    ).length;

    return {
      totalClients: clients.length,
      activeClients,
      totalMonthlyRetainer,
      averageSeoScore,
      clientsNeedingAudit,
    };
  }
}
