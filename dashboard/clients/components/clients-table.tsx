import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientView } from "@backend/application/client/dto";

import { displayWebsite, formatDate } from "../lib";
import { ClientRowActions } from "./client-row-actions";
import { ClientStatusBadge } from "./client-status-badge";

export function ClientsTable({ clients }: { clients: ClientView[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[52px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground h-24 text-center"
              >
                No clients found.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium">{client.name}</div>
                  {client.website && (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      {displayWebsite(client.website)}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {client.contactName || client.contactEmail ? (
                    <div className="text-sm">
                      {client.contactName && <div>{client.contactName}</div>}
                      {client.contactEmail && (
                        <div className="text-muted-foreground text-xs">
                          {client.contactEmail}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ClientStatusBadge status={client.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(client.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <ClientRowActions client={client} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
