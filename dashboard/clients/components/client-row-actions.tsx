"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientView } from "@backend/application/client/dto";

import { archiveClientAction } from "@/app/(dashboard)/clients/actions";
import { ClientFormDialog } from "./client-form-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";
import type { OwnerOption } from "../types";

export function ClientRowActions({
  client,
  owners,
}: {
  client: ClientView;
  owners: OwnerOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleArchive() {
    const nextArchived = !client.isArchived;
    startTransition(async () => {
      const result = await archiveClientAction(client.id, nextArchived);
      if (result.ok) {
        toast.success(nextArchived ? "Client archived." : "Client restored.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${client.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onSelect={toggleArchive}>
            {client.isArchived ? (
              <>
                <ArchiveRestore />
                Restore
              </>
            ) : (
              <>
                <Archive />
                Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        owners={owners}
      />
      <DeleteClientDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        client={client}
      />
    </>
  );
}
