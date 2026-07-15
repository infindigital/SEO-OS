import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { PrismaMetricsRepository } from "./prisma-metrics-repository";

const prisma = new PrismaClient();
const repository = new PrismaMetricsRepository(prisma);

beforeAll(async () => {
  await prisma.dailyMetric.deleteMany();
});

afterAll(async () => {
  await prisma.dailyMetric.deleteMany();
  await prisma.$disconnect();
});

describe("PrismaMetricsRepository (integration)", () => {
  it("returns the most recent metrics ordered oldest-to-newest", async () => {
    const base = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 5; i += 1) {
      await prisma.dailyMetric.create({
        data: {
          date: new Date(base + i * 86_400_000),
          organicTraffic: 100 + i,
          seoScore: 70,
          openTasks: 5,
          developerProgress: 40,
          contentProgress: 30,
        },
      });
    }

    const recent = await repository.listRecent(3);

    expect(recent).toHaveLength(3);
    expect(recent.map((metric) => metric.organicTraffic)).toEqual([102, 103, 104]);
    // New operational fields default to 0 when omitted.
    expect(recent[0].completedTasks).toBe(0);
    expect(recent[0].criticalIssues).toBe(0);
    expect(recent[0].monthlyRevenue).toBe(0);
  });

  it("maps the operational fields when present", async () => {
    await prisma.dailyMetric.deleteMany();
    await prisma.dailyMetric.create({
      data: {
        date: new Date(Date.UTC(2026, 5, 1)),
        organicTraffic: 500,
        seoScore: 75,
        openTasks: 12,
        completedTasks: 9,
        criticalIssues: 4,
        monthlyRevenue: 23000,
        developerProgress: 60,
        contentProgress: 55,
      },
    });

    const [metric] = await repository.listRecent(1);
    expect(metric.completedTasks).toBe(9);
    expect(metric.criticalIssues).toBe(4);
    expect(metric.monthlyRevenue).toBe(23000);
  });
});
