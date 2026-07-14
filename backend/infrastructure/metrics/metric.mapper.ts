import type { DailyMetric as DailyMetricRecord } from "@prisma/client";
import type { DailyMetric } from "@backend/domain/metrics/daily-metric";

export function toDomain(record: DailyMetricRecord): DailyMetric {
  return {
    id: record.id,
    date: record.date,
    organicTraffic: record.organicTraffic,
    seoScore: record.seoScore,
    openTasks: record.openTasks,
    developerProgress: record.developerProgress,
    contentProgress: record.contentProgress,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
