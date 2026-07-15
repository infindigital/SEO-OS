import {
  DEV_TASK_STATUSES,
  type DevTaskStatus,
} from "@backend/domain/developer-task/developer-task-status";

export interface StatusMeta {
  label: string;
  badgeClassName: string;
}

/** Presentation metadata for each task status. */
export const STATUS_META: Record<DevTaskStatus, StatusMeta> = {
  OPEN: {
    label: "Open",
    badgeClassName:
      "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "In progress",
    badgeClassName:
      "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  BLOCKED: {
    label: "Blocked",
    badgeClassName:
      "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  DONE: {
    label: "Done",
    badgeClassName:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

export const STATUS_OPTIONS = DEV_TASK_STATUSES.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));
