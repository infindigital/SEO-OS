const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Format an ISO-8601 date string deterministically for server/client parity. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function formatDateOrDash(iso: string | null): string {
  return iso ? formatDate(iso) : "—";
}

/** Turn an ISO-8601 timestamp into a YYYY-MM-DD value for a date input. */
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

/**
 * Whether an open task's due date is in the past, given a reference time
 * (defaults to now). Completed tasks are never overdue.
 */
export function isOverdue(
  dueDate: string | null,
  isOpen: boolean,
  now: number = Date.now(),
): boolean {
  if (!dueDate || !isOpen) {
    return false;
  }
  return new Date(dueDate).getTime() < now;
}
