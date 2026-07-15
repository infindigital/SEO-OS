import {
  AlertTriangle,
  Code2,
  DollarSign,
  FileClock,
  Gauge,
  ListTodo,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InternalDashboardCards } from "@backend/application/dashboards/dto";

import { formatCurrency, formatNumber } from "../lib";

interface StatSpec {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  emphasis?: "critical";
}

export function StatCards({ cards }: { cards: InternalDashboardCards }) {
  const specs: StatSpec[] = [
    {
      label: "Total Clients",
      value: formatNumber(cards.totalClients),
      hint: "Active workspaces",
      icon: Users,
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(cards.monthlyRevenue),
      hint: "Combined recurring retainer",
      icon: DollarSign,
    },
    {
      label: "Open Tasks",
      value: formatNumber(cards.openTasks),
      hint: "Outstanding across clients",
      icon: ListTodo,
    },
    {
      label: "Critical Issues",
      value: formatNumber(cards.criticalIssues),
      hint: "Need immediate attention",
      icon: AlertTriangle,
      emphasis: cards.criticalIssues > 0 ? "critical" : undefined,
    },
    {
      label: "Reports Pending",
      value: formatNumber(cards.reportsPending),
      hint: "Clients due for an audit",
      icon: FileClock,
    },
    {
      label: "Active Developers",
      value: formatNumber(cards.activeDevelopers),
      hint: "On the delivery team",
      icon: Code2,
    },
    {
      label: "Average SEO Score",
      value: cards.averageSeoScore != null ? String(cards.averageSeoScore) : "—",
      hint: "Across scored clients",
      icon: Gauge,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {specs.map((spec) => {
        const Icon = spec.icon;
        const critical = spec.emphasis === "critical";
        return (
          <Card key={spec.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {spec.label}
              </CardTitle>
              <Icon
                className={
                  critical
                    ? "text-destructive size-4"
                    : "text-muted-foreground size-4"
                }
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
                {spec.value}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{spec.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
