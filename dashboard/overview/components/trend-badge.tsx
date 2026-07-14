import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Trend } from "@backend/domain/metrics/trend";

import { formatPercentChange } from "../lib";

/**
 * Small inline indicator of a metric's change. `positiveIsGood` inverts the
 * colour semantics for metrics where a decrease is desirable (e.g. open tasks).
 */
export function TrendBadge({
  trend,
  positiveIsGood = true,
}: {
  trend: Trend;
  positiveIsGood?: boolean;
}) {
  const label = formatPercentChange(trend.percentage);

  if (trend.direction === "flat" || label === null) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
        <Minus className="size-3" />
        {label ?? "—"}
      </span>
    );
  }

  const isUp = trend.direction === "up";
  const isGood = isUp === positiveIsGood;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isGood
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      )}
    >
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {label}
    </span>
  );
}
