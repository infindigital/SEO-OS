/**
 * Pure validation and normalization rules for client data. Shared as the single
 * source of truth between the domain entity and the interface-layer schemas so
 * that client-side and server-side validation never diverge.
 */

export const CLIENT_NAME_MAX_LENGTH = 120;
export const CLIENT_CONTACT_NAME_MAX_LENGTH = 120;
export const CLIENT_EMAIL_MAX_LENGTH = 320;
export const CLIENT_WEBSITE_MAX_LENGTH = 2048;
export const CLIENT_NOTES_MAX_LENGTH = 5000;
export const CLIENT_INDUSTRY_MAX_LENGTH = 120;
export const CLIENT_CURRENT_FOCUS_MAX_LENGTH = 500;

/** Upper bound for a monthly retainer, in whole currency units. */
export const CLIENT_MAX_MONTHLY_RETAINER = 100_000_000;
/** SEO scores are expressed on a 0–100 scale. */
export const CLIENT_MIN_SEO_SCORE = 0;
export const CLIENT_MAX_SEO_SCORE = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Normalize a free-text website into a canonical absolute URL, or return `null`
 * when the value is blank or cannot be interpreted as a public web address.
 * A bare domain (e.g. "example.com") is upgraded to "https://example.com/".
 */
export function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!url.hostname.includes(".")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isValidWebsite(value: string): boolean {
  return normalizeWebsiteUrl(value) !== null;
}
