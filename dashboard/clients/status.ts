import {
  CLIENT_STATUSES,
  type ClientStatus,
} from "@backend/domain/client/client-status";

export interface ClientStatusMeta {
  label: string;
  badgeClassName: string;
}

/** Presentation metadata for each client status (label + badge colour). */
export const CLIENT_STATUS_META: Record<ClientStatus, ClientStatusMeta> = {
  PROSPECT: {
    label: "Prospect",
    badgeClassName:
      "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  ONBOARDING: {
    label: "Onboarding",
    badgeClassName:
      "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  ACTIVE: {
    label: "Active",
    badgeClassName:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  PAUSED: {
    label: "Paused",
    badgeClassName:
      "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  CHURNED: {
    label: "Churned",
    badgeClassName:
      "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
};

export const CLIENT_STATUS_OPTIONS = CLIENT_STATUSES.map((status) => ({
  value: status,
  label: CLIENT_STATUS_META[status].label,
}));
