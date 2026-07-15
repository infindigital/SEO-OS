import { DomainError } from "@backend/domain/shared/domain-error";
import { ApplicationError } from "@backend/application/shared/application-error";
import type {
  CreateTaskInput,
  DeveloperTaskView,
  UpdateTaskInput,
} from "@backend/application/developer-task/dto";
import type { CreateDeveloperTask } from "@backend/application/developer-task/use-cases/create-task";
import type { UpdateDeveloperTask } from "@backend/application/developer-task/use-cases/update-task";
import type { ListDeveloperTasks } from "@backend/application/developer-task/use-cases/list-tasks";
import type { MarkTaskComplete } from "@backend/application/developer-task/use-cases/mark-task-complete";
import type { AddTaskNote } from "@backend/application/developer-task/use-cases/add-task-note";
import type { UploadTaskScreenshot } from "@backend/application/developer-task/use-cases/upload-task-screenshot";
import {
  ActionResult,
  failure,
  fromZodError,
  ok,
} from "@backend/interface/shared/action-result";
import {
  addNoteSchema,
  createTaskSchema,
  markCompleteSchema,
  updateTaskSchema,
  uploadScreenshotMetaSchema,
  type TaskFormValues,
} from "./developer-task.schemas";

export interface DeveloperTaskUseCases {
  create: CreateDeveloperTask;
  update: UpdateDeveloperTask;
  list: ListDeveloperTasks;
  markComplete: MarkTaskComplete;
  addNote: AddTaskNote;
  uploadScreenshot: UploadTaskScreenshot;
}

export interface ScreenshotUploadInput {
  taskId: string;
  caption: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

function textOrNull(value: string): string | null {
  return value === "" ? null : value;
}

function dateOrNull(value: string): Date | null {
  return value === "" ? null : new Date(`${value}T00:00:00.000Z`);
}

function toCreateInput(values: TaskFormValues): CreateTaskInput {
  return {
    title: values.title,
    description: textOrNull(values.description),
    priority: values.priority,
    status: values.status,
    completion: values.completion === "" ? 0 : Number(values.completion),
    dueDate: dateOrNull(values.dueDate),
    assigneeId: textOrNull(values.assigneeId),
    clientId: textOrNull(values.clientId),
  };
}

function toUpdateInput(id: string, values: TaskFormValues): UpdateTaskInput {
  return {
    id,
    title: values.title,
    description: textOrNull(values.description),
    priority: values.priority,
    status: values.status,
    completion: values.completion === "" ? undefined : Number(values.completion),
    dueDate: dateOrNull(values.dueDate),
    assigneeId: textOrNull(values.assigneeId),
    clientId: textOrNull(values.clientId),
  };
}

/**
 * Interface adapter for developer-task operations. Validates untrusted input,
 * delegates to use cases, and maps errors to a transport-agnostic result.
 */
export class DeveloperTaskController {
  constructor(private readonly useCases: DeveloperTaskUseCases) {}

  async add(input: unknown): Promise<ActionResult<DeveloperTaskView>> {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() => this.useCases.create.execute(toCreateInput(parsed.data)));
  }

  async edit(input: unknown): Promise<ActionResult<DeveloperTaskView>> {
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    const { id, ...values } = parsed.data;
    return this.run(() =>
      this.useCases.update.execute(toUpdateInput(id, values)),
    );
  }

  async setComplete(input: unknown): Promise<ActionResult<DeveloperTaskView>> {
    const parsed = markCompleteSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() =>
      this.useCases.markComplete.execute(parsed.data.id, parsed.data.complete),
    );
  }

  async addNote(
    input: unknown,
    authorId: string | null,
  ): Promise<ActionResult<DeveloperTaskView>> {
    const parsed = addNoteSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() =>
      this.useCases.addNote.execute({
        taskId: parsed.data.taskId,
        authorId,
        body: parsed.data.body,
      }),
    );
  }

  async uploadScreenshot(
    input: ScreenshotUploadInput,
    uploaderId: string | null,
  ): Promise<ActionResult<DeveloperTaskView>> {
    const parsed = uploadScreenshotMetaSchema.safeParse({
      taskId: input.taskId,
      caption: input.caption,
    });
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() =>
      this.useCases.uploadScreenshot.execute({
        taskId: parsed.data.taskId,
        uploaderId,
        filename: input.filename,
        contentType: input.contentType,
        bytes: input.bytes,
        caption: parsed.data.caption || null,
      }),
    );
  }

  private async run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
    try {
      return ok(await fn());
    } catch (error) {
      if (error instanceof DomainError || error instanceof ApplicationError) {
        return failure(error.message);
      }
      console.error("[DeveloperTaskController] unexpected error", error);
      return failure(GENERIC_ERROR);
    }
  }
}
