import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InternalDashboard } from "@backend/application/dashboards/dto";

import { ClientGrowthChart } from "./client-growth-chart";
import { RevenueChart } from "./revenue-chart";
import { SeoHealthChart } from "./seo-health-chart";
import { StatCards } from "./stat-cards";
import { TaskCompletionChart } from "./task-completion-chart";

export function InternalDashboardView({
  dashboard,
}: {
  dashboard: InternalDashboard;
}) {
  const { cards, seoHealth, clientGrowth, revenue, taskCompletion } = dashboard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Internal Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Agency operations at a glance · last {dashboard.rangeDays} days
        </p>
      </div>

      {!dashboard.hasData && (
        <p className="bg-muted text-muted-foreground rounded-md px-4 py-3 text-sm">
          No data yet. Seed demo data with{" "}
          <code className="font-mono">npm run db:seed</code> or add clients to
          get started.
        </p>
      )}

      <StatCards cards={cards} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="SEO Health"
          description="Average portfolio SEO score over time"
        >
          <SeoHealthChart data={seoHealth} />
        </ChartCard>

        <ChartCard
          title="Client Growth"
          description="Cumulative clients by month"
        >
          <ClientGrowthChart data={clientGrowth} />
        </ChartCard>

        <ChartCard
          title="Monthly Revenue"
          description="Recurring retainer revenue over time"
        >
          <RevenueChart data={revenue} />
        </ChartCard>

        <ChartCard
          title="Task Completion"
          description="Completed vs. open tasks over time"
        >
          <TaskCompletionChart data={taskCompletion} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
