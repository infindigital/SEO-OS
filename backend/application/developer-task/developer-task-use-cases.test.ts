import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryDeveloperTaskRepository } from "@backend/infrastructure/developer-task/in-memory-developer-task-repository";
import { InMemoryScreenshotStorage } from "@backend/infrastructure/developer-task/in-memory-screenshot-storage";
import type { IdGenerator } from "@backend/application/client/ports/id-generator";
import { CreateDeveloperTask } from "./use-cases/create-task";
import { UpdateDeveloperTask } from "./use-cases/update-task";
import { ListDeveloperTasks } from "./use-cases/list-tasks";
import { MarkTaskComplete } from "./use-cases/mark-task-complete";
import { AddTaskNote } from "./use-cases/add-task-note";
import { UploadTaskScreenshot } from "./use-cases/upload-task-screenshot";
import { GetDeveloperBoardSummary } from "./use-cases/get-board-summary";
import {
  DeveloperTaskNotFoundError,
  UnsupportedScreenshotTypeError,
} from "./developer-task.errors";

class SequentialIdGenerator implements IdGenerator {
  private count = 0;
  generate(): string {
    this.count += 1;
    return `id-${this.count}`;
  }
}

describe("Developer task use cases", () => {
  let repo: InMemoryDeveloperTaskRepository;
  let storage: InMemoryScreenshotStorage;
  let ids: SequentialIdGenerator;
  let create: CreateDeveloperTask;
  let update: UpdateDeveloperTask;
  let list: ListDeveloperTasks;
  let markComplete: MarkTaskComplete;
  let addNote: AddTaskNote;
  let upload: UploadTaskScreenshot;
  let summary: GetDeveloperBoardSummary;

  beforeEach(() => {
    repo = new InMemoryDeveloperTaskRepository();
    storage = new InMemoryScreenshotStorage();
    ids = new SequentialIdGenerator();
    create = new CreateDeveloperTask(repo, ids);
    update = new UpdateDeveloperTask(repo);
    list = new ListDeveloperTasks(repo);
    markComplete = new MarkTaskComplete(repo);
    addNote = new AddTaskNote(repo, ids);
    upload = new UploadTaskScreenshot(repo, storage, ids);
    summary = new GetDeveloperBoardSummary(repo);
  });

  it("creates a task and returns a serializable view", async () => {
    const view = await create.execute({
      title: "Fix 404s",
      priority: "HIGH",
      assigneeId: "dev-1",
    });
    expect(view.id).toBe("id-1");
    expect(view.priority).toBe("HIGH");
    expect(view.isOpen).toBe(true);
    expect(typeof view.createdAt).toBe("string");
  });

  it("filters by status, openOnly, and assignee", async () => {
    await create.execute({ title: "A", assigneeId: "dev-1" });
    await create.execute({ title: "B", assigneeId: "dev-2", status: "DONE" });
    await create.execute({ title: "C", assigneeId: "dev-1", status: "BLOCKED" });

    expect(await list.execute({ openOnly: true })).toHaveLength(2);
    expect(await list.execute({ status: "DONE" })).toHaveLength(1);
    const forDev1 = await list.execute({ assigneeId: "dev-1" });
    expect(forDev1.map((t) => t.title).sort()).toEqual(["A", "C"]);
  });

  it("marks a task complete and reopens it", async () => {
    const task = await create.execute({ title: "A" });

    const done = await markComplete.execute(task.id, true);
    expect(done.status).toBe("DONE");
    expect(done.completion).toBe(100);
    expect(done.completedAt).not.toBeNull();

    const reopened = await markComplete.execute(task.id, false);
    expect(reopened.status).toBe("IN_PROGRESS");
    expect(reopened.completedAt).toBeNull();
  });

  it("updates task fields", async () => {
    const task = await create.execute({ title: "A" });
    const updated = await update.execute({
      id: task.id,
      priority: "CRITICAL",
      completion: 50,
    });
    expect(updated.priority).toBe("CRITICAL");
    expect(updated.completion).toBe(50);
    expect(updated.status).toBe("IN_PROGRESS");
  });

  it("rejects updating a missing task", async () => {
    await expect(update.execute({ id: "missing", title: "x" })).rejects.toBeInstanceOf(
      DeveloperTaskNotFoundError,
    );
  });

  it("adds a note to a task", async () => {
    const task = await create.execute({ title: "A" });
    const view = await addNote.execute({
      taskId: task.id,
      authorId: "dev-1",
      body: "started",
    });
    expect(view.notes).toHaveLength(1);
    expect(view.notes[0].body).toBe("started");
    expect(view.notes[0].authorId).toBe("dev-1");
  });

  it("uploads a screenshot and attaches it", async () => {
    const task = await create.execute({ title: "A" });
    const view = await upload.execute({
      taskId: task.id,
      uploaderId: "dev-1",
      filename: "before after.png",
      contentType: "image/png",
      bytes: new Uint8Array([1, 2, 3]),
      caption: "fix preview",
    });

    expect(view.screenshots).toHaveLength(1);
    expect(view.screenshots[0].caption).toBe("fix preview");
    expect(view.screenshots[0].url).toContain("memory://");
    // Stored under a sanitized key scoped to the task.
    const key = [...storage.stored.keys()][0];
    expect(key.startsWith(`${task.id}/`)).toBe(true);
    expect(key).not.toContain(" ");
  });

  it("rejects a non-image screenshot", async () => {
    const task = await create.execute({ title: "A" });
    await expect(
      upload.execute({
        taskId: task.id,
        uploaderId: null,
        filename: "notes.txt",
        contentType: "text/plain",
        bytes: new Uint8Array([1]),
      }),
    ).rejects.toBeInstanceOf(UnsupportedScreenshotTypeError);
  });

  it("computes board KPIs including overdue", async () => {
    const now = new Date("2026-07-15T00:00:00.000Z");
    await create.execute({
      title: "Overdue",
      dueDate: new Date("2026-07-10T00:00:00.000Z"),
      completion: 20,
    });
    await create.execute({ title: "Done", status: "DONE" });
    await create.execute({
      title: "Future",
      dueDate: new Date("2026-08-01T00:00:00.000Z"),
      completion: 40,
    });

    const board = await summary.execute(now);
    expect(board.totalTasks).toBe(3);
    expect(board.completedTasks).toBe(1);
    expect(board.openTasks).toBe(2);
    expect(board.overdueTasks).toBe(1);
    // (20 + 100 + 40) / 3 = 53.3 → 53
    expect(board.averageCompletion).toBe(53);
  });
});
