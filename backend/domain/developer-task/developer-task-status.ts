/**
 * Workflow statuses for a developer task. Kept in sync with the
 * `DevTaskStatus` enum in the Prisma schema.
 */
export const DEV_TASK_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
] as const;

export type DevTaskStatus = (typeof DEV_TASK_STATUSES)[number];

export function isDevTaskStatus(value: unknown): value is DevTaskStatus {
  return (
    typeof value === "string" &&
    (DEV_TASK_STATUSES as readonly string[]).includes(value)
  );
}

/** A task is "open" (outstanding) unless it has been completed. */
export function isOpenStatus(status: DevTaskStatus): boolean {
  return status !== "DONE";
}
