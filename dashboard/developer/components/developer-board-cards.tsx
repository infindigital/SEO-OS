import { CheckCircle2, CircleDot, Gauge, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeveloperBoardSummary } from "@backend/application/developer-task/dto";

interface CardSpec {
  label: string;
  value: string;
  hint: string;
  icon: typeof CircleDot;
  emphasis?: "critical";
}

export function DeveloperBoardCards({
  summary,
}: {
  summary: DeveloperBoardSummary;
}) {
  const cards: CardSpec[] = [
    {
      label: "Open Tasks",
      value: String(summary.openTasks),
      hint: "Outstanding work",
      icon: CircleDot,
    },
    {
      label: "Completed",
      value: String(summary.completedTasks),
      hint: `of ${summary.totalTasks} total`,
      icon: CheckCircle2,
    },
    {
      label: "Overdue",
      value: String(summary.overdueTasks),
      hint: "Past due date",
      icon: TriangleAlert,
      emphasis: summary.overdueTasks > 0 ? "critical" : undefined,
    },
    {
      label: "Avg. Completion",
      value: `${summary.averageCompletion}%`,
      hint: "Across all tasks",
      icon: Gauge,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const critical = card.emphasis === "critical";
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.label}
              </CardTitle>
              <Icon
                className={critical ? "text-destructive size-4" : "text-muted-foreground size-4"}
              />
            </CardHeader>
            <CardContent>
              <div
                className={
                  critical
                    ? "text-destructive text-2xl font-semibold tabular-nums"
                    : "text-2xl font-semibold tabular-nums"
                }
              >
                {card.value}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{card.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
