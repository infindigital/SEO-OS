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
  });
});
