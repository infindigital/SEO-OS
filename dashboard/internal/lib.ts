const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const CURRENCY_COMPACT_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function formatCurrency(value: number): string {
  return CURRENCY_FORMAT.format(value);
}

export function formatCompactCurrency(value: number): string {
  return CURRENCY_COMPACT_FORMAT.format(value);
}

export function formatShortDate(iso: string): string {
  return SHORT_DATE_FORMAT.format(new Date(iso));
}

export function formatMonth(iso: string): string {
  return MONTH_FORMAT.format(new Date(iso));
}
