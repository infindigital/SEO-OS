import type { Prisma } from "@prisma/client";
import { DeveloperTask } from "@backend/domain/developer-task/developer-task";
import type { DevTaskPriority } from "@backend/domain/developer-task/developer-task-priority";
import type { DevTaskStatus } from "@backend/domain/developer-task/developer-task-status";

/** A task record with its notes and screenshots included. */
export type DeveloperTaskRecord = Prisma.DeveloperTaskGetPayload<{
  include: { notes: true; screenshots: true };
}>;

export function toDomain(record: DeveloperTaskRecord): DeveloperTask {
  return DeveloperTask.reconstitute({
    id: record.id,
    title: record.title,
    description: record.description,
    priority: record.priority as DevTaskPriority,
    status: record.status as DevTaskStatus,
    completion: record.completion,
    dueDate: record.dueDate,
    assigneeId: record.assigneeId,
    clientId: record.clientId,
    completedAt: record.completedAt,
    notes: record.notes.map((note) => ({
      id: note.id,
      authorId: note.authorId,
      body: note.body,
      createdAt: note.createdAt,
    })),
    screenshots: record.screenshots.map((shot) => ({
      id: shot.id,
      uploaderId: shot.uploaderId,
      path: shot.path,
      url: shot.url,
      caption: shot.caption,
      createdAt: shot.createdAt,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
