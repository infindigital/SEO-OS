function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Default reporting window: `days` of data ending `lagDays` before now, since
 * Search Console data lags a couple of days.
 */
export function defaultDateRange(
  now: Date,
  days = 28,
  lagDays = 3,
): { startDate: string; endDate: string } {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - lagDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}
