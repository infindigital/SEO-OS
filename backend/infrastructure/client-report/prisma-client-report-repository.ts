import type { PrismaClient } from "@prisma/client";
import type { ClientReport } from "@backend/domain/client-report/client-report";
import type { ClientReportRepository } from "@backend/application/client-report/ports/client-report-repository";
import { toDomain } from "./client-report.mapper";

/** Prisma-backed implementation of the {@link ClientReportRepository} port. */
export class PrismaClientReportRepository implements ClientReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(report: ClientReport): Promise<void> {
    await this.prisma.clientReport.create({
      data: {
        id: report.id,
        clientId: report.clientId,
        title: report.title,
        period: report.period,
        summary: report.summary,
        url: report.url,
        publishedAt: report.publishedAt,
        createdAt: report.createdAt,
      },
    });
  }

  async listByClient(clientId: string): Promise<ClientReport[]> {
    const records = await this.prisma.clientReport.findMany({
      where: { clientId },
      orderBy: { publishedAt: "desc" },
    });
    return records.map(toDomain);
  }
}
