const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Format an ISO-8601 date string deterministically for server/client parity. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** Render a URL as its bare host (e.g. "example.com"), falling back to raw. */
export function displayWebsite(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
