import type { CSSProperties } from "react";

/** Tooltip surface shared by every internal-dashboard chart. */
export const TOOLTIP_STYLE: CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--popover-foreground)",
  fontSize: "0.8rem",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--muted-foreground)",
  marginBottom: "0.15rem",
};

/** Recessive tick styling shared across axes. */
export const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };
