import type { ClientReport as ClientReportRecord } from "@prisma/client";
import { ClientReport } from "@backend/domain/client-report/client-report";

export function toDomain(record: ClientReportRecord): ClientReport {
  return ClientReport.reconstitute({
    id: record.id,
    clientId: record.clientId,
    title: record.title,
    period: record.period,
    summary: record.summary,
    url: record.url,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
  });
}
