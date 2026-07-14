import { USER_ROLES, type UserRole } from "@backend/domain/auth/user-role";

export interface UserRoleMeta {
  label: string;
  badgeClassName: string;
}

export const USER_ROLE_META: Record<UserRole, UserRoleMeta> = {
  ADMIN: {
    label: "Admin",
    badgeClassName:
      "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  DEVELOPER: {
    label: "Developer",
    badgeClassName:
      "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  CLIENT: {
    label: "Client",
    badgeClassName:
      "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const USER_ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value: role,
  label: USER_ROLE_META[role].label,
}));
