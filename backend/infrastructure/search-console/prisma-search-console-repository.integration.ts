import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { PrismaSearchConsoleRepository } from "./prisma-search-console-repository";

const prisma = new PrismaClient();
const repository = new PrismaSearchConsoleRepository(prisma);
let clientId: string;

async function reset(): Promise<void> {
  await prisma.pageCoverage.deleteMany();
  await prisma.searchAnalyticsRow.deleteMany();
  await prisma.searchConsoleConnection.deleteMany();
  await prisma.client.deleteMany();
}

beforeAll(async () => {
  await reset();
  const client = await prisma.client.create({ data: { name: "GSC Test" } });
  clientId = client.id;
});

afterAll(async () => {
  await reset();
  await prisma.$disconnect();
});

describe("PrismaSearchConsoleRepository (integration)", () => {
  it("upserts a connection, analytics rows and coverage", async () => {
    const connection = await repository.upsertConnection({
      clientId,
      siteUrl: "https://ex.com/",
      refreshToken: "rt",
    });
    expect(connection.status).toBe("CONNECTED");
    expect(await repository.listConnections()).toHaveLength(1);

    const saved = await repository.upsertAnalyticsRows(connection.id, [
      { dimension: "QUERY", key: "seo", date: new Date("2026-07-01"), clicks: 10, impressions: 100, ctr: 0.1, position: 2 },
      { dimension: "PAGE", key: "https://ex.com/a", date: new Date("2026-07-01"), clicks: 5, impressions: 50, ctr: 0.1, position: 3 },
    ]);
    expect(saved).toBe(2);

    // Re-upserting the same key updates rather than duplicating.
    await repository.upsertAnalyticsRows(connection.id, [
      { dimension: "QUERY", key: "seo", date: new Date("2026-07-01"), clicks: 20, impressions: 100, ctr: 0.2, position: 2 },
    ]);
    const rows = await prisma.searchAnalyticsRow.findMany({
      where: { connectionId: connection.id },
    });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.keyValue === "seo")?.clicks).toBe(20);

    await repository.upsertCoverage(connection.id, [
      {
        page: "https://ex.com/a",
        coverageState: "Submitted and indexed",
        verdict: "PASS",
        lastCrawledAt: null,
      },
    ]);
    const coverage = await prisma.pageCoverage.findMany({
      where: { connectionId: connection.id },
    });
    expect(coverage).toHaveLength(1);

    await repository.markSynced(connection.id, new Date());
    expect((await repository.getConnection(connection.id))?.lastSyncedAt).not.toBeNull();
  });
});
