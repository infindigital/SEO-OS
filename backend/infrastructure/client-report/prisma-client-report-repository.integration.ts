import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { Client } from "@backend/domain/client/client";
import { ClientReport } from "@backend/domain/client-report/client-report";
import { CryptoIdGenerator } from "@backend/infrastructure/id/crypto-id-generator";
import { PrismaClientRepository } from "@backend/infrastructure/client/prisma-client-repository";
import { PrismaClientReportRepository } from "./prisma-client-report-repository";

const prisma = new PrismaClient();
const clientRepo = new PrismaClientRepository(prisma);
const reportRepo = new PrismaClientReportRepository(prisma);
const ids = new CryptoIdGenerator();

beforeAll(async () => {
  await prisma.clientReport.deleteMany();
  await prisma.client.deleteMany();
});

afterAll(async () => {
  await prisma.clientReport.deleteMany();
  await prisma.client.deleteMany();
  await prisma.$disconnect();
});

describe("PrismaClientReportRepository (integration)", () => {
  it("finds a client by contact email and cascades report deletion", async () => {
    const client = Client.create({
      id: ids.generate(),
      name: "Portal Co",
      contactEmail: "owner@portal.co",
    });
    await clientRepo.create(client);

    // Case-insensitive contact-email lookup (portal resolution).
    const found = await clientRepo.findByContactEmail("OWNER@PORTAL.CO");
    expect(found?.id).toBe(client.id);
    expect(await clientRepo.findByContactEmail("nobody@x.com")).toBeNull();

    await reportRepo.create(
      ClientReport.create({
        id: ids.generate(),
        clientId: client.id,
        title: "June report",
        period: "June 2026",
        publishedAt: new Date("2026-06-30T00:00:00.000Z"),
      }),
    );
    await reportRepo.create(
      ClientReport.create({
        id: ids.generate(),
        clientId: client.id,
        title: "Q2 review",
        publishedAt: new Date("2026-07-10T00:00:00.000Z"),
      }),
    );

    const reports = await reportRepo.listByClient(client.id);
    expect(reports.map((r) => r.title)).toEqual(["Q2 review", "June report"]); // newest first

    // Deleting the client cascades to its reports.
    await clientRepo.delete(client.id);
    expect(await prisma.clientReport.count()).toBe(0);
  });
});
