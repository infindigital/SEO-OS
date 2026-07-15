import { describe, expect, it } from "vitest";

import { InMemoryMetricsRepository } from "@backend/infrastructure/metrics/in-memory-metrics-repository";
import type { DailyMetric } from "@backend/domain/metrics/daily-metric";
import { GetDashboardOverview } from "./use-cases/get-dashboard-overview";

function metric(day: number, overrides: Partial<DailyMetric> = {}): DailyMetric {
  const date = new Date(Date.UTC(2026, 0, day));
  return {
    id: `metric-${day}`,
    date,
    organicTraffic: 1000,
    seoScore: 70,
    openTasks: 10,
    completedTasks: 6,
    criticalIssues: 2,
    monthlyRevenue: 20000,
    developerProgress: 50,
    contentProgress: 40,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe("GetDashboardOverview", () => {
  it("returns an empty, flagged overview when there is no data", async () => {
    const overview = await new GetDashboardOverview(
      new InMemoryMetricsRepository(),
    ).execute({ days: 30 });

    expect(overview.hasData).toBe(false);
    expect(overview.traffic.series).toEqual([]);
    expect(overview.seoScore.value).toBe(0);
    expect(overview.developerProgress).toBe(0);
  });

  it("aggregates latest values, totals and trends", async () => {
    const repository = new InMemoryMetricsRepository([
      metric(1, { organicTraffic: 1000, seoScore: 60, openTasks: 20 }),
      metric(2, { organicTraffic: 1200, seoScore: 66, openTasks: 16 }),
      metric(3, {
        organicTraffic: 1500,
        seoScore: 72,
        openTasks: 12,
        developerProgress: 60,
        contentProgress: 55,
      }),
    ]);

    const overview = await new GetDashboardOverview(repository).execute({
      days: 30,
    });

    expect(overview.hasData).toBe(true);
    expect(overview.traffic.current).toBe(1500);
    expect(overview.traffic.total).toBe(3700);
    expect(overview.traffic.series).toHaveLength(3);
    expect(overview.traffic.trend.direction).toBe("up");
    expect(overview.seoScore.value).toBe(72);
    expect(overview.openTasks.value).toBe(12);
    expect(overview.openTasks.trend.direction).toBe("down");
    expect(overview.developerProgress).toBe(60);
    expect(overview.contentProgress).toBe(55);
  });

  it("respects the days limit and keeps the most recent window", async () => {
    const repository = new InMemoryMetricsRepository([
      metric(1, { organicTraffic: 100 }),
      metric(2, { organicTraffic: 200 }),
      metric(3, { organicTraffic: 300 }),
    ]);

    const overview = await new GetDashboardOverview(repository).execute({
      days: 2,
    });

    expect(overview.traffic.series).toHaveLength(2);
    expect(overview.traffic.total).toBe(500);
    expect(overview.traffic.current).toBe(300);
  });
});
