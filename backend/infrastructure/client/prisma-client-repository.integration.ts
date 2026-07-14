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
});
