import { Badge } from "@/components/ui/badge";

/** Colour thresholds for an SEO score badge (0–100). */
function scoreClassName(score: number): string {
  if (score >= 80) {
    return "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (score >= 50) {
    return "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
}

export function SeoScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  return (
    <Badge className={`${scoreClassName(score)} tabular-nums`}>{score}</Badge>
  );
}
