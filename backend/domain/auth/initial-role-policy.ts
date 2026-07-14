import type { UserRole } from "./user-role";
import { normalizeEmail } from "../shared/email";

/**
 * Decide the role to assign to a newly registered user. Emails listed in
 * `adminEmails` (typically sourced from configuration) are bootstrapped as
 * admins; everyone else defaults to a client. This is how the very first admin
 * account is provisioned without exposing role selection to self-signup.
 */
export function resolveInitialRole(
  email: string,
  adminEmails: readonly string[],
): UserRole {
  const normalized = normalizeEmail(email);
  const admins = adminEmails.map((value) => normalizeEmail(value));
  return admins.includes(normalized) ? "ADMIN" : "CLIENT";
}
