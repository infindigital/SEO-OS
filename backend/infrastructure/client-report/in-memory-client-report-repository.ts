import type { ClientReport } from "@backend/domain/client-report/client-report";
import type { ClientReportRepository } from "@backend/application/client-report/ports/client-report-repository";

/** In-memory {@link ClientReportRepository} for unit tests. */
export class InMemoryClientReportRepository implements ClientReportRepository {
  private readonly store: ClientReport[] = [];

  async create(report: ClientReport): Promise<void> {
    this.store.push(report);
  }

  async listByClient(clientId: string): Promise<ClientReport[]> {
    return this.store
      .filter((report) => report.clientId === clientId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}
