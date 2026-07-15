import { Activity, CalendarClock, DollarSign, Gauge, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientPortfolioSummary } from "@backend/application/client/dto";

import { formatCurrency } from "../lib";

interface CardSpec {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
}

export function ClientPortfolioCards({
  summary,
}: {
  summary: ClientPortfolioSummary;
}) {
  const cards: CardSpec[] = [
    {
      label: "Total clients",
      value: String(summary.totalClients),
      hint: "Active workspaces",
      icon: Users,
    },
    {
      label: "Active",
      value: String(summary.activeClients),
      hint: "Status: active",
      icon: Activity,
    },
    {
      label: "Monthly retainer",
      value: formatCurrency(summary.totalMonthlyRetainer),
      hint: "Combined recurring revenue",
      icon: DollarSign,
    },
    {
      label: "Avg. SEO score",
      value: summary.averageSeoScore != null ? String(summary.averageSeoScore) : "—",
      hint: "Across scored clients",
      icon: Gauge,
    },
    {
      label: "Needs audit",
      value: String(summary.clientsNeedingAudit),
      hint: "No audit in 30+ days",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.label}
              </CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
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
