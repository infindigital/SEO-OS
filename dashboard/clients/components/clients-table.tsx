import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientView } from "@backend/application/client/dto";

import { displayWebsite, formatCurrency, formatDateOrDash } from "../lib";
import { ClientRowActions } from "./client-row-actions";
import { ClientStatusBadge } from "./client-status-badge";
import { SeoScoreBadge } from "./seo-score-badge";
import type { OwnerOption } from "../types";

export function ClientsTable({
  clients,
  owners,
}: {
  clients: ClientView[];
  owners: OwnerOption[];
}) {
  const ownerLabels = new Map(owners.map((owner) => [owner.id, owner.label]));

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">SEO</TableHead>
              <TableHead className="text-right">Retainer</TableHead>
              <TableHead>Last audit</TableHead>
              <TableHead className="w-[52px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground h-24 text-center"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                      {client.isArchived && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Archived
                        </Badge>
                      )}
                    </div>
                    {client.website && (
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground block text-xs"
                      >
                        {displayWebsite(client.website)}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {client.ownerId ? (
                      (ownerLabels.get(client.ownerId) ?? "—")
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {client.industry ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <SeoScoreBadge score={client.seoScore} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {client.monthlyRetainer != null ? (
                      formatCurrency(client.monthlyRetainer)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateOrDash(client.lastAuditAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ClientRowActions client={client} owners={owners} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
