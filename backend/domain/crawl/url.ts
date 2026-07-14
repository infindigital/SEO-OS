/** Pure URL helpers used by the crawler. */

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolve `href` (optionally against `base`) to an absolute http(s) URL with the
 * fragment stripped, or return `null` if it is not a usable web address.
 */
export function normalizeUrl(href: string, base?: string): string | null {
  try {
    const url = base ? new URL(href, base) : new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function getHost(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isSameHost(value: string, host: string): boolean {
  const valueHost = getHost(value);
  return valueHost !== null && valueHost === host.toLowerCase();
}
