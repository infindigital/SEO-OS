import { describe, expect, it } from "vitest";

import { DeveloperTask } from "./developer-task";
import {
  EmptyTaskNoteError,
  InvalidTaskCompletionError,
  InvalidTaskTitleError,
} from "./developer-task.errors";

describe("DeveloperTask entity", () => {
  it("creates a task with normalized defaults", () => {
    const task = DeveloperTask.create({ id: "t1", title: "  Fix canonicals  " });

    expect(task.title).toBe("Fix canonicals");
    expect(task.priority).toBe("MEDIUM");
    expect(task.status).toBe("OPEN");
    expect(task.completion).toBe(0);
    expect(task.completedAt).toBeNull();
    expect(task.isOpen).toBe(true);
  });

  it("creating with status DONE forces 100% completion and a timestamp", () => {
    const task = DeveloperTask.create({ id: "t1", title: "X", status: "DONE" });
    expect(task.completion).toBe(100);
    expect(task.completedAt).not.toBeNull();
    expect(task.isOpen).toBe(false);
  });

  it("rejects a blank title", () => {
    expect(() => DeveloperTask.create({ id: "t1", title: "   " })).toThrow(
      InvalidTaskTitleError,
    );
  });

  it("rejects an out-of-range or fractional completion", () => {
    expect(() =>
      DeveloperTask.create({ id: "t1", title: "X", completion: 101 }),
    ).toThrow(InvalidTaskCompletionError);
    expect(() =>
      DeveloperTask.create({ id: "t1", title: "X", completion: -1 }),
    ).toThrow(InvalidTaskCompletionError);
    expect(() =>
      DeveloperTask.create({ id: "t1", title: "X", completion: 33.3 }),
    ).toThrow(InvalidTaskCompletionError);
  });

  it("marks complete and reopens consistently", () => {
    const task = DeveloperTask.create({ id: "t1", title: "X" });

    task.markComplete(new Date("2026-07-15T00:00:00.000Z"));
    expect(task.status).toBe("DONE");
    expect(task.completion).toBe(100);
    expect(task.completedAt).toEqual(new Date("2026-07-15T00:00:00.000Z"));

    task.reopen();
    expect(task.status).toBe("IN_PROGRESS");
    expect(task.completedAt).toBeNull();
    expect(task.completion).toBe(90); // stepped down from 100
  });

  it("setting completion to 100 via update marks the task done", () => {
    const task = DeveloperTask.create({ id: "t1", title: "X" });
    task.update({ completion: 100 });
    expect(task.status).toBe("DONE");
    expect(task.completedAt).not.toBeNull();
  });

  it("reopening via status update clears completion above 100", () => {
    const task = DeveloperTask.create({ id: "t1", title: "X", status: "DONE" });
    task.update({ status: "OPEN" });
    expect(task.status).toBe("OPEN");
    expect(task.completion).toBe(90);
    expect(task.completedAt).toBeNull();
  });

  it("adds notes and screenshots, rejecting an empty note", () => {
    const task = DeveloperTask.create({ id: "t1", title: "X" });

    const note = task.addNote({ id: "n1", authorId: "dev1", body: "  looking into it " });
    expect(note.body).toBe("looking into it");
    expect(task.notes).toHaveLength(1);

    expect(() => task.addNote({ id: "n2", authorId: null, body: "   " })).toThrow(
      EmptyTaskNoteError,
    );

    task.addScreenshot({ id: "s1", uploaderId: "dev1", path: "t1/s1.png", url: "https://x/s1.png" });
    expect(task.screenshots).toHaveLength(1);
    expect(task.screenshots[0].url).toBe("https://x/s1.png");
  });
});
