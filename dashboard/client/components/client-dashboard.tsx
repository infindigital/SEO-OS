import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AnalyticsRowView,
  ClientDashboard,
} from "@backend/application/dashboards/dto";

import { ClientStatusBadge } from "@dashboard/clients/components/client-status-badge";
import {
  formatCompact,
  formatNumber,
  formatPercent,
  formatPosition,
} from "@dashboard/shared/format";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function RowsCard({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: AnalyticsRowView[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{label}</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impr.</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Pos.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-16 text-center text-sm"
                >
                  No data yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="max-w-[16rem] truncate">
                    {row.key}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.clicks)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.impressions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(row.ctr)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPosition(row.position)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ClientDashboardView({
  dashboard,
}: {
  dashboard: ClientDashboard;
}) {
  const { client, connection, totals } = dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-muted-foreground text-sm">
              <Link href="/agency" className="hover:underline">
                Agency
              </Link>{" "}
              / Client
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {client.name}
            </h1>
          </div>
          <ClientStatusBadge status={client.status} />
        </div>
        {connection && (
          <div className="text-muted-foreground text-right text-xs">
            <div>{connection.siteUrl}</div>
            <div>
              {connection.lastSyncedAt
                ? `Last synced ${new Date(connection.lastSyncedAt).toLocaleString("en-US")}`
                : "Not yet synced"}
            </div>
          </div>
        )}
      </div>

      {!connection ? (
        <p className="bg-muted text-muted-foreground rounded-md px-4 py-3 text-sm">
          No Search Console connection for this client. Connect a property to see
          performance and coverage data.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Clicks" value={formatCompact(totals.clicks)} />
            <StatCard
              label="Impressions"
              value={formatCompact(totals.impressions)}
            />
            <StatCard label="CTR" value={formatPercent(totals.ctr)} />
            <StatCard
              label="Avg. position"
              value={formatPosition(totals.position)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RowsCard
              title="Top queries"
              label="Query"
              rows={dashboard.topQueries}
            />
            <RowsCard title="Top pages" label="Page" rows={dashboard.topPages} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Index coverage</CardTitle>
              <CardDescription>Pages by coverage state</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.coverage.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No coverage data yet.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {dashboard.coverage.map((bucket) => (
                    <li
                      key={bucket.state}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{bucket.state}</span>
                      <span className="font-medium tabular-nums">
                        {formatNumber(bucket.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
