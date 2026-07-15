import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { Client } from "@backend/domain/client/client";
import { CryptoIdGenerator } from "@backend/infrastructure/id/crypto-id-generator";
import { PrismaClientRepository } from "./prisma-client-repository";

const prisma = new PrismaClient();
const repository = new PrismaClientRepository(prisma);
const ids = new CryptoIdGenerator();

beforeAll(async () => {
  await prisma.client.deleteMany();
});

afterAll(async () => {
  await prisma.client.deleteMany();
  await prisma.$disconnect();
});

describe("PrismaClientRepository (integration)", () => {
  it("persists, reads, searches, updates and deletes a client", async () => {
    const client = Client.create({
      id: ids.generate(),
      name: "Acme Corp",
      website: "acme.com",
      contactName: "Jane Doe",
      contactEmail: "team@acme.com",
      status: "ACTIVE",
    });

    await repository.create(client);

    const byId = await repository.findById(client.id);
    expect(byId?.name).toBe("Acme Corp");
    expect(byId?.website).toBe("https://acme.com/");
    expect(byId?.status).toBe("ACTIVE");

    // Case-insensitive search across indexed fields.
    expect(await repository.list({ search: "ACME" })).toHaveLength(1);
    expect(await repository.list({ search: "jane" })).toHaveLength(1);
    expect(await repository.list({ search: "nomatch" })).toHaveLength(0);

    // Status filter.
    expect(await repository.list({ status: "ACTIVE" })).toHaveLength(1);
    expect(await repository.list({ status: "CHURNED" })).toHaveLength(0);

    client.update({ name: "Acme Inc", status: "PAUSED" });
    await repository.update(client);

    const updated = await repository.findById(client.id);
    expect(updated?.name).toBe("Acme Inc");
    expect(updated?.status).toBe("PAUSED");

    await repository.delete(client.id);
    expect(await repository.findById(client.id)).toBeNull();
  });

  it("persists portfolio fields and honours archive filters", async () => {
    const ownerId = ids.generate();
    const owner = await prisma.profile.create({
      data: {
        id: ownerId,
        email: `owner-${ownerId}@example.com`,
        role: "DEVELOPER",
      },
    });

    const client = Client.create({
      id: ids.generate(),
      name: "Portfolio Co",
      ownerId: owner.id,
      industry: "Healthcare",
      monthlyRetainer: 4200,
      seoScore: 88,
      lastAuditAt: new Date("2026-05-01T00:00:00.000Z"),
      currentFocus: "Local SEO",
    });
    await repository.create(client);

    const stored = await repository.findById(client.id);
    expect(stored?.ownerId).toBe(owner.id);
    expect(stored?.industry).toBe("Healthcare");
    expect(stored?.monthlyRetainer).toBe(4200);
    expect(stored?.seoScore).toBe(88);
    expect(stored?.currentFocus).toBe("Local SEO");
    expect(stored?.lastAuditAt?.toISOString()).toBe(
      "2026-05-01T00:00:00.000Z",
    );

    // Search matches the industry field.
    expect(await repository.list({ search: "healthcare" })).toHaveLength(1);

    // Archive filtering.
    client.archive(new Date("2026-06-01T00:00:00.000Z"));
    await repository.update(client);

    expect(await repository.list({})).toHaveLength(0);
    expect(await repository.list({ archivedOnly: true })).toHaveLength(1);
    expect(await repository.list({ includeArchived: true })).toHaveLength(1);

    // Owner FK is nulled when the profile is removed (onDelete: SetNull).
    await prisma.profile.delete({ where: { id: owner.id } });
    expect((await repository.findById(client.id))?.ownerId).toBeNull();

    await repository.delete(client.id);
  });
});
