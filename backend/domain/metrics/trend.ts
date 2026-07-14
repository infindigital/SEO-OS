export type TrendDirection = "up" | "down" | "flat";

export interface Trend {
  /** Absolute change from the previous value (null when no baseline exists). */
  delta: number | null;
  /** Percentage change from the previous value (null when not computable). */
  percentage: number | null;
  direction: TrendDirection;
}

/**
 * Compute the change between the current and previous values. Returns a flat
 * trend with null deltas when there is no baseline to compare against.
 */
export function computeTrend(
  current: number,
  previous: number | null,
): Trend {
  if (previous === null) {
    return { delta: null, percentage: null, direction: "flat" };
  }

  const delta = current - previous;
  const direction: TrendDirection =
    delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const percentage = previous === 0 ? null : (delta / previous) * 100;

  return { delta, percentage, direction };
}
