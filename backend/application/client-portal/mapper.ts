import type { ClientReport } from "@backend/domain/client-report/client-report";
import type { PortalReport } from "./dto";

export function toPortalReport(report: ClientReport): PortalReport {
  return {
    id: report.id,
    title: report.title,
    period: report.period,
    summary: report.summary,
    url: report.url,
    publishedAt: report.publishedAt.toISOString(),
  };
}
