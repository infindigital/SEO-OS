import { ClientReport } from "@backend/domain/client-report/client-report";
import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import type { ClientReportRepository } from "@backend/application/client-report/ports/client-report-repository";
import type { IdGenerator } from "@backend/application/client/ports/id-generator";
import { ClientNotFoundError } from "@backend/application/client/client.errors";
import type { PortalReport, PublishReportInput } from "../dto";
import { toPortalReport } from "../mapper";

/** Publish a client-facing report to a client's portal. */
export class PublishClientReport {
  constructor(
    private readonly clients: ClientRepository,
    private readonly reports: ClientReportRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: PublishReportInput): Promise<PortalReport> {
    const client = await this.clients.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    const report = ClientReport.create({
      id: this.ids.generate(),
      clientId: input.clientId,
      title: input.title,
      period: input.period ?? null,
      summary: input.summary ?? null,
      url: input.url ?? null,
    });

    await this.reports.create(report);
    return toPortalReport(report);
  }
}
