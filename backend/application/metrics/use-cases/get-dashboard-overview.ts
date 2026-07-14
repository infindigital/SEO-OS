import { computeTrend } from "@backend/domain/metrics/trend";
import type { DailyMetric } from "@backend/domain/metrics/daily-metric";
import type { MetricsRepository } from "../ports/metrics-repository";
import type { DashboardOverview, DashboardOverviewQuery } from "../dto";

const DEFAULT_RANGE_DAYS = 30;

export class GetDashboardOverview {
  constructor(private readonly metrics: MetricsRepository) {}

  async execute(query: DashboardOverviewQuery = {}): Promise<DashboardOverview> {
    const days = query.days ?? DEFAULT_RANGE_DAYS;
    const metrics = await this.metrics.listRecent(days);

    if (metrics.length === 0) {
      return emptyOverview(days);
    }

    const latest = metrics[metrics.length - 1];
    const previous = metrics.length > 1 ? metrics[metrics.length - 2] : null;

    return {
      rangeDays: days,
      hasData: true,
      traffic: {
        current: latest.organicTraffic,
        total: metrics.reduce((sum, metric) => sum + metric.organicTraffic, 0),
        trend: computeTrend(
          latest.organicTraffic,
          previous?.organicTraffic ?? null,
        ),
        series: metrics.map(toTrafficPoint),
      },
      seoScore: {
        value: latest.seoScore,
        trend: computeTrend(latest.seoScore, previous?.seoScore ?? null),
      },
      openTasks: {
        value: latest.openTasks,
        trend: computeTrend(latest.openTasks, previous?.openTasks ?? null),
        series: metrics.map(toTasksPoint),
      },
      developerProgress: latest.developerProgress,
      contentProgress: latest.contentProgress,
    };
  }
}

function toTrafficPoint(metric: DailyMetric) {
  return { date: metric.date.toISOString(), visitors: metric.organicTraffic };
}

function toTasksPoint(metric: DailyMetric) {
  return { date: metric.date.toISOString(), open: metric.openTasks };
}

function emptyOverview(days: number): DashboardOverview {
  const flat = { delta: null, percentage: null, direction: "flat" as const };
  return {
    rangeDays: days,
    hasData: false,
    traffic: { current: 0, total: 0, trend: flat, series: [] },
    seoScore: { value: 0, trend: flat },
    openTasks: { value: 0, trend: flat, series: [] },
    developerProgress: 0,
    contentProgress: 0,
  };
}
