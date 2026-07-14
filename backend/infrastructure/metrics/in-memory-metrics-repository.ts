import type { DailyMetric } from "@backend/domain/metrics/daily-metric";
import type { MetricsRepository } from "@backend/application/metrics/ports/metrics-repository";

/** In-memory {@link MetricsRepository} for unit tests. */
export class InMemoryMetricsRepository implements MetricsRepository {
  private readonly metrics: DailyMetric[];

  constructor(metrics: DailyMetric[] = []) {
    this.metrics = [...metrics];
  }

  async listRecent(days: number): Promise<DailyMetric[]> {
    const take = Math.max(1, Math.trunc(days));
    const sorted = [...this.metrics].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    return sorted.slice(-take);
  }
}
