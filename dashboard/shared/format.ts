const NUMBER = new Intl.NumberFormat("en-US");
const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

export function formatCompact(value: number): string {
  return COMPACT.format(value);
}

/** Format a fraction (0–1) as a percentage, e.g. 0.042 -> "4.2%". */
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

export function formatPosition(value: number): string {
  return value.toFixed(1);
}
