import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { PrismaSearchConsoleReadRepository } from "./prisma-search-console-read-repository";

const prisma = new PrismaClient();
const repository = new PrismaSearchConsoleReadRepository(prisma);
let connectionId: string;

async function reset(): Promise<void> {
  await prisma.pageCoverage.deleteMany();
  await prisma.searchAnalyticsRow.deleteMany();
  await prisma.searchConsoleConnection.deleteMany();
  await prisma.client.deleteMany();
}

beforeAll(async () => {
  await reset();
  const client = await prisma.client.create({ data: { name: "Read Test" } });
  const connection = await prisma.searchConsoleConnection.create({
    data: { clientId: client.id, siteUrl: "https://ex.com/", status: "CONNECTED" },
  });
  connectionId = connection.id;

  const date1 = new Date("2026-07-01");
  const date2 = new Date("2026-07-02");
  await prisma.searchAnalyticsRow.createMany({
    data: [
      { connectionId, dimension: "QUERY", keyValue: "seo", date: date1, clicks: 10, impressions: 100, ctr: 0.1, position: 2 },
      { connectionId, dimension: "QUERY", keyValue: "seo", date: date2, clicks: 15, impressions: 120, ctr: 0.125, position: 2 },
      { connectionId, dimension: "QUERY", keyValue: "tools", date: date1, clicks: 3, impressions: 90, ctr: 0.033, position: 5 },
      { connectionId, dimension: "PAGE", keyValue: "https://ex.com/a", date: date1, clicks: 8, impressions: 80, ctr: 0.1, position: 3 },
    ],
  });
  await prisma.pageCoverage.createMany({
    data: [
      { connectionId, page: "https://ex.com/a", coverageState: "Submitted and indexed", verdict: "PASS" },
      { connectionId, page: "https://ex.com/b", coverageState: "Submitted and indexed", verdict: "PASS" },
    ],
  });
});

afterAll(async () => {
  await reset();
  await prisma.$disconnect();
});

describe("PrismaSearchConsoleReadRepository (integration)", () => {
  it("summarizes clicks/impressions per client", async () => {
    const summaries = await repository.getClientMetricSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].clicks).toBe(28); // 10 + 15 + 3 (QUERY rows)
    expect(summaries[0].impressions).toBe(310);
  });

  it("totals query metrics", async () => {
    const totals = await repository.totals(connectionId, "QUERY");
    expect(totals.clicks).toBe(28);
    expect(totals.impressions).toBe(310);
  });

  it("returns top rows aggregated by key and ordered by clicks", async () => {
    const rows = await repository.topRows(connectionId, "QUERY", 10);
    expect(rows[0].key).toBe("seo"); // 25 clicks aggregated across two days
    expect(rows[0].clicks).toBe(25);
    expect(rows[1].key).toBe("tools");
  });

  it("breaks coverage down by state", async () => {
    const breakdown = await repository.coverageBreakdown(connectionId);
    expect(breakdown).toEqual([
      { state: "Submitted and indexed", count: 2 },
    ]);
  });
});
