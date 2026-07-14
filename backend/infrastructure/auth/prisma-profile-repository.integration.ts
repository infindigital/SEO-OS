import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { Profile } from "@backend/domain/auth/profile";
import { PrismaProfileRepository } from "./prisma-profile-repository";

const prisma = new PrismaClient();
const repository = new PrismaProfileRepository(prisma);

beforeAll(async () => {
  await prisma.profile.deleteMany();
});

afterAll(async () => {
  await prisma.profile.deleteMany();
  await prisma.$disconnect();
});

describe("PrismaProfileRepository (integration)", () => {
  it("creates, finds by id and email, updates role and lists", async () => {
    const id = crypto.randomUUID();
    const profile = Profile.create({
      id,
      email: "admin@infin.dev",
      role: "ADMIN",
    });

    await repository.create(profile);

    expect((await repository.findById(id))?.role).toBe("ADMIN");
    expect((await repository.findByEmail("admin@infin.dev"))?.id).toBe(id);

    const stored = await repository.findById(id);
    stored!.changeRole("DEVELOPER");
    await repository.update(stored!);

    expect((await repository.findById(id))?.role).toBe("DEVELOPER");
    expect(await repository.list()).toHaveLength(1);
  });
});
