import { z } from "zod";

import { DEV_TASK_PRIORITIES } from "@backend/domain/developer-task/developer-task-priority";
import { DEV_TASK_STATUSES } from "@backend/domain/developer-task/developer-task-status";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_NOTE_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from "@backend/domain/developer-task/developer-task";

export const prioritySchema = z.enum(DEV_TASK_PRIORITIES);
export const statusSchema = z.enum(DEV_TASK_STATUSES);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER_PATTERN = /^\d+$/;

function isRealDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || UUID_PATTERN.test(value), {
    message: "Select a valid option.",
  });

/**
 * Validation schema for the task form. String-valued (empty allowed for
 * optional fields) so it drives client-side and server-side validation from a
 * single definition; the controller coerces to typed values.
 */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(TASK_TITLE_MAX_LENGTH, `Title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(
      TASK_DESCRIPTION_MAX_LENGTH,
      `Description must be ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    ),
  priority: prioritySchema,
  status: statusSchema,
  completion: z
    .string()
    .trim()
    .refine((value) => value === "" || INTEGER_PATTERN.test(value), {
      message: "Enter a whole number.",
    })
    .refine((value) => value === "" || Number(value) <= 100, {
      message: "Completion must be between 0 and 100.",
    }),
  dueDate: z
    .string()
    .trim()
    .refine((value) => value === "" || DATE_PATTERN.test(value), {
      message: "Use the date picker to choose a valid date.",
    })
    .refine((value) => value === "" || isRealDate(value), {
      message: "That date does not exist.",
    }),
  assigneeId: optionalUuid,
  clientId: optionalUuid,
});

export const createTaskSchema = taskFormSchema;

export const updateTaskSchema = taskFormSchema.extend({
  id: z.uuid("A valid task id is required."),
});

export const markCompleteSchema = z.object({
  id: z.uuid("A valid task id is required."),
  complete: z.boolean(),
});

export const addNoteSchema = z.object({
  taskId: z.uuid("A valid task id is required."),
  body: z
    .string()
    .trim()
    .min(1, "A note cannot be empty.")
    .max(TASK_NOTE_MAX_LENGTH, `Note must be ${TASK_NOTE_MAX_LENGTH} characters or fewer.`),
});

export const uploadScreenshotMetaSchema = z.object({
  taskId: z.uuid("A valid task id is required."),
  caption: z.string().trim().max(300, "Caption is too long."),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type CreateTaskPayload = z.infer<typeof createTaskSchema>;
export type UpdateTaskPayload = z.infer<typeof updateTaskSchema>;
export type AddNotePayload = z.infer<typeof addNoteSchema>;
