/**
 * Lifecycle stages of a client engagement. Kept in sync with the
 * `ClientStatus` enum in the Prisma schema.
 */
export const CLIENT_STATUSES = [
  "PROSPECT",
  "ONBOARDING",
  "ACTIVE",
  "PAUSED",
  "CHURNED",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export function isClientStatus(value: unknown): value is ClientStatus {
  return (
    typeof value === "string" &&
    (CLIENT_STATUSES as readonly string[]).includes(value)
  );
}
