const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format an ISO-8601 date string deterministically for server/client parity. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** Format an ISO-8601 date string, or an em dash when null. */
export function formatDateOrDash(iso: string | null): string {
  return iso ? formatDate(iso) : "—";
}

/** Format a whole-currency-unit amount as USD (e.g. 2500 → "$2,500"). */
export function formatCurrency(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

/** Turn an ISO-8601 timestamp into a YYYY-MM-DD value for a date input. */
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

/** Render a URL as its bare host (e.g. "example.com"), falling back to raw. */
export function displayWebsite(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
