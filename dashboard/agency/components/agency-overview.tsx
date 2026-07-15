import Link from "next/link";

import {
  Card,
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
import type { AgencyOverview } from "@backend/application/dashboards/dto";

import { ClientStatusBadge } from "@dashboard/clients/components/client-status-badge";
import { formatCompact, formatNumber, formatPercent } from "@dashboard/shared/format";

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

export function AgencyOverviewView({ overview }: { overview: AgencyOverview }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Agency dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Search Console performance across all client workspaces.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients" value={formatNumber(overview.clientCount)} />
        <StatCard
          label="Connected"
          value={formatNumber(overview.connectedCount)}
        />
        <StatCard
          label="Clicks (period)"
          value={formatCompact(overview.totals.clicks)}
        />
        <StatCard
          label="Impressions (period)"
          value={formatCompact(overview.totals.impressions)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-24 text-center"
                >
                  No clients yet.
                </TableCell>
              </TableRow>
            ) : (
              overview.clients.map(({ client, gsc }) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium hover:underline"
                    >
                      {client.name}
                    </Link>
                    {gsc && (
                      <div className="text-muted-foreground text-xs">
                        {gsc.siteUrl}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  {gsc ? (
                    <>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(gsc.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(gsc.impressions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(gsc.ctr)}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground text-right text-sm"
                    >
                      Search Console not connected
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
