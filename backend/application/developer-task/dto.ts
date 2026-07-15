import type { DevTaskPriority } from "@backend/domain/developer-task/developer-task-priority";
import type { DevTaskStatus } from "@backend/domain/developer-task/developer-task-status";

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: DevTaskPriority;
  status?: DevTaskStatus;
  completion?: number;
  dueDate?: Date | null;
  assigneeId?: string | null;
  clientId?: string | null;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  priority?: DevTaskPriority;
  status?: DevTaskStatus;
  completion?: number;
  dueDate?: Date | null;
  assigneeId?: string | null;
  clientId?: string | null;
}

export interface ListTasksQuery {
  status?: DevTaskStatus;
  assigneeId?: string;
  clientId?: string;
  /** When true, exclude completed (DONE) tasks. */
  openOnly?: boolean;
}

export interface AddNoteInput {
  taskId: string;
  authorId?: string | null;
  body: string;
}

export interface UploadScreenshotInput {
  taskId: string;
  uploaderId?: string | null;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  caption?: string | null;
}

export interface TaskNoteView {
  id: string;
  authorId: string | null;
  body: string;
  createdAt: string;
}

export interface TaskScreenshotView {
  id: string;
  uploaderId: string | null;
  path: string;
  url: string | null;
  caption: string | null;
  createdAt: string;
}

/** Serializable read model for a developer task. */
export interface DeveloperTaskView {
  id: string;
  title: string;
  description: string | null;
  priority: DevTaskPriority;
  status: DevTaskStatus;
  completion: number;
  dueDate: string | null;
  assigneeId: string | null;
  clientId: string | null;
  completedAt: string | null;
  isOpen: boolean;
  notes: TaskNoteView[];
  screenshots: TaskScreenshotView[];
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperBoardSummary {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletion: number;
}
