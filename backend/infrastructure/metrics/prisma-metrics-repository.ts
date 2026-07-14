import type { PrismaClient } from "@prisma/client";
import type { DailyMetric } from "@backend/domain/metrics/daily-metric";
import type { MetricsRepository } from "@backend/application/metrics/ports/metrics-repository";
import { toDomain } from "./metric.mapper";

/** Prisma-backed implementation of the {@link MetricsRepository} port. */
export class PrismaMetricsRepository implements MetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listRecent(days: number): Promise<DailyMetric[]> {
    const take = Math.max(1, Math.trunc(days));
    const records = await this.prisma.dailyMetric.findMany({
      orderBy: { date: "desc" },
      take,
    });
    // Fetched newest-first for the limit; return oldest-to-newest.
    return records.reverse().map(toDomain);
  }
}
