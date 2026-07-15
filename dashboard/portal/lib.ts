const NUMBER = new Intl.NumberFormat("en-US");
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function formatDateOrDash(iso: string | null): string {
  return iso ? formatDate(iso) : "—";
}

export function displayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
