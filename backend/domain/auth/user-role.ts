/**
 * Access-control roles. Kept in sync with the `UserRole` enum in the Prisma
 * schema.
 */
export const USER_ROLES = ["ADMIN", "DEVELOPER", "CLIENT"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Roles that belong to internal staff (as opposed to external clients). */
export const STAFF_ROLES: readonly UserRole[] = ["ADMIN", "DEVELOPER"];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" && (USER_ROLES as readonly string[]).includes(value)
  );
}

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}
