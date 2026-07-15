import {
  isDevTaskPriority,
  type DevTaskPriority,
} from "./developer-task-priority";
import {
  isDevTaskStatus,
  isOpenStatus,
  type DevTaskStatus,
} from "./developer-task-status";
import {
  EmptyTaskNoteError,
  InvalidTaskCompletionError,
  InvalidTaskPriorityError,
  InvalidTaskStatusError,
  InvalidTaskTitleError,
} from "./developer-task.errors";

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;
export const TASK_NOTE_MAX_LENGTH = 2000;

export interface TaskNote {
  id: string;
  authorId: string | null;
  body: string;
  createdAt: Date;
}

export interface TaskScreenshot {
  id: string;
  uploaderId: string | null;
  path: string;
  url: string | null;
  caption: string | null;
  createdAt: Date;
}

export interface DeveloperTaskProps {
  id: string;
  title: string;
  description: string | null;
  priority: DevTaskPriority;
  status: DevTaskStatus;
  completion: number;
  dueDate: Date | null;
  assigneeId: string | null;
  clientId: string | null;
  completedAt: Date | null;
  notes: TaskNote[];
  screenshots: TaskScreenshot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeveloperTaskProps {
  id: string;
  title: string;
  description?: string | null;
  priority?: DevTaskPriority;
  status?: DevTaskStatus;
  completion?: number;
  dueDate?: Date | null;
  assigneeId?: string | null;
  clientId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateDeveloperTaskProps {
  title?: string;
  description?: string | null;
  priority?: DevTaskPriority;
  status?: DevTaskStatus;
  completion?: number;
  dueDate?: Date | null;
  assigneeId?: string | null;
  clientId?: string | null;
}

/**
 * A unit of engineering work. Owns the invariants that keep status and
 * completion consistent (e.g. a completed task is 100% done with a timestamp).
 */
export class DeveloperTask {
  private constructor(private props: DeveloperTaskProps) {}

  static create(input: CreateDeveloperTaskProps): DeveloperTask {
    const now = input.createdAt ?? new Date();
    const status = normalizeStatus(input.status ?? "OPEN");
    const completion = normalizeCompletion(input.completion ?? 0);

    return new DeveloperTask({
      id: input.id,
      title: normalizeTitle(input.title),
      description: normalizeOptionalText(input.description ?? null),
      priority: normalizePriority(input.priority ?? "MEDIUM"),
      status,
      completion: status === "DONE" ? 100 : completion,
      dueDate: input.dueDate ?? null,
      assigneeId: normalizeOptionalText(input.assigneeId ?? null),
      clientId: normalizeOptionalText(input.clientId ?? null),
      completedAt: status === "DONE" ? now : null,
      notes: [],
      screenshots: [],
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: DeveloperTaskProps): DeveloperTask {
    return new DeveloperTask({
      ...props,
      notes: [...props.notes],
      screenshots: [...props.screenshots],
    });
  }

  update(changes: UpdateDeveloperTaskProps): void {
    if (changes.title !== undefined) {
      this.props.title = normalizeTitle(changes.title);
    }
    if (changes.description !== undefined) {
      this.props.description = normalizeOptionalText(changes.description);
    }
    if (changes.priority !== undefined) {
      this.props.priority = normalizePriority(changes.priority);
    }
    if (changes.dueDate !== undefined) {
      this.props.dueDate = changes.dueDate;
    }
    if (changes.assigneeId !== undefined) {
      this.props.assigneeId = normalizeOptionalText(changes.assigneeId);
    }
    if (changes.clientId !== undefined) {
      this.props.clientId = normalizeOptionalText(changes.clientId);
    }
    if (changes.completion !== undefined) {
      this.applyCompletion(normalizeCompletion(changes.completion));
    }
    if (changes.status !== undefined) {
      this.applyStatus(normalizeStatus(changes.status));
    }
    this.touch();
  }

  /** Apply a completion percentage, keeping status consistent. */
  private applyCompletion(value: number): void {
    this.props.completion = value;
    if (value >= 100) {
      this.props.status = "DONE";
      this.props.completedAt = this.props.completedAt ?? new Date();
    } else if (this.props.status === "DONE") {
      this.props.status = "IN_PROGRESS";
      this.props.completedAt = null;
    } else if (value > 0 && this.props.status === "OPEN") {
      // Partial progress on an untouched task moves it into progress.
      this.props.status = "IN_PROGRESS";
    }
  }

  /** Apply a status, keeping completion and the completed timestamp consistent. */
  private applyStatus(value: DevTaskStatus): void {
    this.props.status = value;
    if (value === "DONE") {
      this.props.completion = 100;
      this.props.completedAt = this.props.completedAt ?? new Date();
    } else {
      this.props.completedAt = null;
      if (this.props.completion >= 100) {
        this.props.completion = 90;
      }
    }
  }

  markComplete(at: Date = new Date()): void {
    this.props.status = "DONE";
    this.props.completion = 100;
    this.props.completedAt = at;
    this.touch();
  }

  reopen(): void {
    if (this.props.status === "DONE") {
      this.props.status = "IN_PROGRESS";
      this.props.completedAt = null;
      if (this.props.completion >= 100) {
        this.props.completion = 90;
      }
      this.touch();
    }
  }

  addNote(note: { id: string; authorId: string | null; body: string; createdAt?: Date }): TaskNote {
    const body = note.body.trim();
    if (body.length === 0) {
      throw new EmptyTaskNoteError();
    }
    const created: TaskNote = {
      id: note.id,
      authorId: normalizeOptionalText(note.authorId),
      body: body.slice(0, TASK_NOTE_MAX_LENGTH),
      createdAt: note.createdAt ?? new Date(),
    };
    this.props.notes.push(created);
    this.touch();
    return created;
  }

  addScreenshot(shot: {
    id: string;
    uploaderId: string | null;
    path: string;
    url?: string | null;
    caption?: string | null;
    createdAt?: Date;
  }): TaskScreenshot {
    const created: TaskScreenshot = {
      id: shot.id,
      uploaderId: normalizeOptionalText(shot.uploaderId),
      path: shot.path,
      url: shot.url ?? null,
      caption: normalizeOptionalText(shot.caption ?? null),
      createdAt: shot.createdAt ?? new Date(),
    };
    this.props.screenshots.push(created);
    this.touch();
    return created;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string | null {
    return this.props.description;
  }
  get priority(): DevTaskPriority {
    return this.props.priority;
  }
  get status(): DevTaskStatus {
    return this.props.status;
  }
  get completion(): number {
    return this.props.completion;
  }
  get dueDate(): Date | null {
    return this.props.dueDate;
  }
  get assigneeId(): string | null {
    return this.props.assigneeId;
  }
  get clientId(): string | null {
    return this.props.clientId;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get isOpen(): boolean {
    return isOpenStatus(this.props.status);
  }
  get notes(): readonly TaskNote[] {
    return this.props.notes;
  }
  get screenshots(): readonly TaskScreenshot[] {
    return this.props.screenshots;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function normalizeTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > TASK_TITLE_MAX_LENGTH) {
    throw new InvalidTaskTitleError();
  }
  return trimmed;
}

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizePriority(value: DevTaskPriority): DevTaskPriority {
  if (!isDevTaskPriority(value)) {
    throw new InvalidTaskPriorityError(String(value));
  }
  return value;
}

function normalizeStatus(value: DevTaskStatus): DevTaskStatus {
  if (!isDevTaskStatus(value)) {
    throw new InvalidTaskStatusError(String(value));
  }
  return value;
}

function normalizeCompletion(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new InvalidTaskCompletionError(value);
  }
  return value;
}
