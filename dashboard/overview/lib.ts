const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const COMPACT_FORMAT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function formatCompact(value: number): string {
  return COMPACT_FORMAT.format(value);
}

export function formatShortDate(iso: string): string {
  return SHORT_DATE_FORMAT.format(new Date(iso));
}

export function formatPercentChange(percentage: number | null): string | null {
  if (percentage === null) {
    return null;
  }
  const rounded = Math.round(Math.abs(percentage) * 10) / 10;
  return `${rounded}%`;
}
