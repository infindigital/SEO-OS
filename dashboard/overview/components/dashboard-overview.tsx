import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardOverview } from "@backend/application/metrics/dto";

import { formatNumber } from "../lib";
import { MetricGauge } from "./metric-gauge";
import { TasksSparkline } from "./tasks-sparkline";
import { TrafficChart } from "./traffic-chart";
import { TrendBadge } from "./trend-badge";

export function DashboardOverviewView({
  overview,
  email,
}: {
  overview: DashboardOverview;
  email: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Signed in as {email}</p>
      </div>

      {!overview.hasData && (
        <p className="bg-muted text-muted-foreground rounded-md px-4 py-3 text-sm">
          No metrics yet. Seed demo data with{" "}
          <code className="font-mono">npm run db:seed</code> or connect your
          analytics pipeline.
        </p>
      )}

      {/* Traffic — primary chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic</CardTitle>
          <CardDescription>
            Organic visitors · last {overview.rangeDays} days
          </CardDescription>
          <CardAction>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">
                {formatNumber(overview.traffic.current)}
              </div>
              <TrendBadge trend={overview.traffic.trend} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TrafficChart data={overview.traffic.series} />
          <p className="text-muted-foreground mt-2 text-xs">
            {formatNumber(overview.traffic.total)} visitors over the period
          </p>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO Score</CardTitle>
            <CardDescription>Out of 100</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <MetricGauge
              value={overview.seoScore.value}
              unit=""
              color="var(--chart-2)"
            />
            <div className="flex justify-center">
              <TrendBadge trend={overview.seoScore.trend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Tasks</CardTitle>
            <CardDescription>Currently outstanding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-semibold tabular-nums">
                {formatNumber(overview.openTasks.value)}
              </span>
              <TrendBadge
                trend={overview.openTasks.trend}
                positiveIsGood={false}
              />
            </div>
            <TasksSparkline data={overview.openTasks.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Developer Progress</CardTitle>
            <CardDescription>Engineering completion</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricGauge
              value={overview.developerProgress}
              color="var(--chart-1)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Progress</CardTitle>
            <CardDescription>Editorial completion</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricGauge
              value={overview.contentProgress}
              color="var(--chart-3)"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
