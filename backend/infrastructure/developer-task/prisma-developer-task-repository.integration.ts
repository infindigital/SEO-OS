import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { DeveloperTask } from "@backend/domain/developer-task/developer-task";
import { CryptoIdGenerator } from "@backend/infrastructure/id/crypto-id-generator";
import { PrismaDeveloperTaskRepository } from "./prisma-developer-task-repository";

const prisma = new PrismaClient();
const repository = new PrismaDeveloperTaskRepository(prisma);
const ids = new CryptoIdGenerator();

beforeAll(async () => {
  await prisma.developerTask.deleteMany();
});

afterAll(async () => {
  await prisma.developerTask.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.$disconnect();
});

describe("PrismaDeveloperTaskRepository (integration)", () => {
  it("persists a task with notes and screenshots, filters, and cascades", async () => {
    const assigneeId = ids.generate();
    await prisma.profile.create({
      data: { id: assigneeId, email: `dev-${assigneeId}@example.com`, role: "DEVELOPER" },
    });

    const task = DeveloperTask.create({
      id: ids.generate(),
      title: "Fix broken links",
      priority: "HIGH",
      assigneeId,
      dueDate: new Date("2026-08-01T00:00:00.000Z"),
      completion: 25,
    });
    await repository.create(task);

    const note = task.addNote({ id: ids.generate(), authorId: assigneeId, body: "on it" });
    await repository.saveNote(task.id, note);

    const shot = task.addScreenshot({
      id: ids.generate(),
      uploaderId: assigneeId,
      path: `${task.id}/before.png`,
      url: "https://example.com/before.png",
      caption: "before",
    });
    await repository.saveScreenshot(task.id, shot);

    const stored = await repository.findById(task.id);
    expect(stored?.title).toBe("Fix broken links");
    expect(stored?.priority).toBe("HIGH");
    expect(stored?.completion).toBe(25);
    expect(stored?.notes).toHaveLength(1);
    expect(stored?.notes[0].body).toBe("on it");
    expect(stored?.screenshots).toHaveLength(1);
    expect(stored?.screenshots[0].caption).toBe("before");

    // Filters.
    expect(await repository.list({ openOnly: true })).toHaveLength(1);
    expect(await repository.list({ status: "DONE" })).toHaveLength(0);
    expect(await repository.list({ assigneeId })).toHaveLength(1);

    // Update marks complete.
    stored!.markComplete();
    await repository.update(stored!);
    const done = await repository.findById(task.id);
    expect(done?.status).toBe("DONE");
    expect(done?.completion).toBe(100);

    // Assignee FK is nulled when the profile is removed (onDelete: SetNull).
    await prisma.profile.delete({ where: { id: assigneeId } });
    expect((await repository.findById(task.id))?.assigneeId).toBeNull();

    // Deleting the task cascades to notes and screenshots.
    await repository.delete(task.id);
    expect(await repository.findById(task.id)).toBeNull();
    expect(await prisma.developerTaskNote.count()).toBe(0);
    expect(await prisma.developerTaskScreenshot.count()).toBe(0);
  });
});
