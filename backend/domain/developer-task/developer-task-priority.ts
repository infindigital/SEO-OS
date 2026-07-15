/**
 * Priority levels for a developer task. Kept in sync with the
 * `DevTaskPriority` enum in the Prisma schema.
 */
export const DEV_TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type DevTaskPriority = (typeof DEV_TASK_PRIORITIES)[number];

export function isDevTaskPriority(value: unknown): value is DevTaskPriority {
  return (
    typeof value === "string" &&
    (DEV_TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

/** Numeric rank for sorting (highest priority first). */
export const DEV_TASK_PRIORITY_RANK: Record<DevTaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
