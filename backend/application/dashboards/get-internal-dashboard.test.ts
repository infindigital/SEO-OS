import { describe, expect, it } from "vitest";

import { Client } from "@backend/domain/client/client";
import { Profile } from "@backend/domain/auth/profile";
import type { DailyMetric } from "@backend/domain/metrics/daily-metric";
import { InMemoryClientRepository } from "@backend/infrastructure/client/in-memory-client-repository";
import { InMemoryProfileRepository } from "@backend/infrastructure/auth/in-memory-profile-repository";
import { InMemoryMetricsRepository } from "@backend/infrastructure/metrics/in-memory-metrics-repository";
import { GetInternalDashboard } from "./use-cases/get-internal-dashboard";

const NOW = new Date("2026-07-15T00:00:00.000Z");

function metric(date: string, overrides: Partial<DailyMetric> = {}): DailyMetric {
  return {
    id: date,
    date: new Date(date),
    organicTraffic: 1000,
    seoScore: 70,
    openTasks: 12,
    completedTasks: 8,
    criticalIssues: 3,
    monthlyRevenue: 20000,
    developerProgress: 50,
    contentProgress: 40,
    createdAt: new Date(date),
    updatedAt: new Date(date),
    ...overrides,
  };
}

describe("GetInternalDashboard", () => {
  it("aggregates live cards and historical series", async () => {
    const metrics = new InMemoryMetricsRepository([
      metric("2026-07-13T00:00:00.000Z", {
        seoScore: 60,
        monthlyRevenue: 18000,
        openTasks: 15,
        completedTasks: 5,
        criticalIssues: 9,
      }),
      metric("2026-07-14T00:00:00.000Z", {
        seoScore: 72,
        monthlyRevenue: 21000,
        openTasks: 10,
        completedTasks: 11,
        criticalIssues: 4,
      }),
    ]);

    const clientRepo = new InMemoryClientRepository();
    await clientRepo.create(
      Client.create({
        id: "c1",
        name: "Acme",
        status: "ACTIVE",
        monthlyRetainer: 3000,
        seoScore: 80,
        lastAuditAt: new Date("2026-07-10T00:00:00.000Z"),
        createdAt: new Date("2026-05-04T00:00:00.000Z"),
      }),
    );
    await clientRepo.create(
      Client.create({
        id: "c2",
        name: "Globex",
        status: "PROSPECT",
        monthlyRetainer: 1500,
        seoScore: 40,
        // No lastAuditAt → reports pending.
        createdAt: new Date("2026-06-20T00:00:00.000Z"),
      }),
    );
    // Archived client: excluded from live cards but still counted in growth.
    const archived = Client.create({
      id: "c3",
      name: "Initech",
      status: "ACTIVE",
      monthlyRetainer: 9000,
      createdAt: new Date("2026-05-15T00:00:00.000Z"),
    });
    archived.archive();
    await clientRepo.create(archived);

    const profileRepo = new InMemoryProfileRepository();
    await profileRepo.create(
      Profile.create({ id: "p1", email: "dev1@infin.dev", role: "DEVELOPER" }),
    );
    await profileRepo.create(
      Profile.create({ id: "p2", email: "dev2@infin.dev", role: "DEVELOPER" }),
    );
    await profileRepo.create(
      Profile.create({ id: "p3", email: "admin@infin.dev", role: "ADMIN" }),
    );

    const useCase = new GetInternalDashboard(metrics, clientRepo, profileRepo);
    const result = await useCase.execute({ days: 30 }, NOW);

    // Cards use live, non-archived clients.
    expect(result.cards.totalClients).toBe(2);
    expect(result.cards.monthlyRevenue).toBe(4500);
    expect(result.cards.averageSeoScore).toBe(60);
    expect(result.cards.reportsPending).toBe(1); // Globex has no audit.
    expect(result.cards.activeDevelopers).toBe(2);
    // Snapshot counters come from the latest metric.
    expect(result.cards.openTasks).toBe(10);
    expect(result.cards.criticalIssues).toBe(4);

    // Series.
    expect(result.seoHealth.map((p) => p.score)).toEqual([60, 72]);
    expect(result.revenue.map((p) => p.revenue)).toEqual([18000, 21000]);
    expect(result.taskCompletion.at(-1)).toMatchObject({ open: 10, completed: 11 });

    // Growth counts all clients (incl. archived), cumulative by month.
    expect(result.clientGrowth).toEqual([
      { month: "2026-05-01T00:00:00.000Z", added: 2, total: 2 },
      { month: "2026-06-01T00:00:00.000Z", added: 1, total: 3 },
    ]);

    expect(result.hasData).toBe(true);
    expect(result.rangeDays).toBe(30);
  });

  it("returns empty, defaulted values when there is no data", async () => {
    const useCase = new GetInternalDashboard(
      new InMemoryMetricsRepository(),
      new InMemoryClientRepository(),
      new InMemoryProfileRepository(),
    );

    const result = await useCase.execute({}, NOW);

    expect(result.hasData).toBe(false);
    expect(result.cards).toEqual({
      totalClients: 0,
      monthlyRevenue: 0,
      openTasks: 0,
      criticalIssues: 0,
      reportsPending: 0,
      activeDevelopers: 0,
      averageSeoScore: null,
    });
    expect(result.seoHealth).toEqual([]);
    expect(result.clientGrowth).toEqual([]);
    expect(result.revenue).toEqual([]);
    expect(result.taskCompletion).toEqual([]);
  });
});
