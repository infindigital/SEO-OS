import type {
  DeveloperTask,
  TaskNote,
  TaskScreenshot,
} from "@backend/domain/developer-task/developer-task";
import type {
  DeveloperTaskView,
  TaskNoteView,
  TaskScreenshotView,
} from "./dto";

function toNoteView(note: TaskNote): TaskNoteView {
  return {
    id: note.id,
    authorId: note.authorId,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  };
}

function toScreenshotView(shot: TaskScreenshot): TaskScreenshotView {
  return {
    id: shot.id,
    uploaderId: shot.uploaderId,
    path: shot.path,
    url: shot.url,
    caption: shot.caption,
    createdAt: shot.createdAt.toISOString(),
  };
}

export function toDeveloperTaskView(task: DeveloperTask): DeveloperTaskView {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    completion: task.completion,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assigneeId: task.assigneeId,
    clientId: task.clientId,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    isOpen: task.isOpen,
    notes: [...task.notes]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(toNoteView),
    screenshots: [...task.screenshots]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(toScreenshotView),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
