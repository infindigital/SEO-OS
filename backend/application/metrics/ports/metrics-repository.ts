import type { DailyMetric } from "@backend/domain/metrics/daily-metric";

export interface MetricsRepository {
  /**
   * Return up to the `days` most recent daily metrics, ordered oldest to
   * newest.
   */
  listRecent(days: number): Promise<DailyMetric[]>;
}
