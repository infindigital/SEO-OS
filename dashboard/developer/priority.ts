import {
  DEV_TASK_PRIORITIES,
  type DevTaskPriority,
} from "@backend/domain/developer-task/developer-task-priority";

export interface PriorityMeta {
  label: string;
  badgeClassName: string;
}

/** Presentation metadata for each task priority. */
export const PRIORITY_META: Record<DevTaskPriority, PriorityMeta> = {
  CRITICAL: {
    label: "Critical",
    badgeClassName:
      "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  HIGH: {
    label: "High",
    badgeClassName:
      "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  MEDIUM: {
    label: "Medium",
    badgeClassName:
      "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  LOW: {
    label: "Low",
    badgeClassName:
      "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const PRIORITY_OPTIONS = DEV_TASK_PRIORITIES.map((priority) => ({
  value: priority,
  label: PRIORITY_META[priority].label,
}));
