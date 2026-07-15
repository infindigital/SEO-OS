/** A compact 0–100% completion meter. */
export function CompletionBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 100
      ? "bg-emerald-500"
      : clamped >= 50
        ? "bg-blue-500"
        : "bg-amber-500";

  return (
    <div className="flex items-center gap-2">
      <div
        className="bg-muted h-2 w-24 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
