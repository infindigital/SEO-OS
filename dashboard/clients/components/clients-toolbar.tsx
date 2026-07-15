"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientStatus } from "@backend/domain/client/client-status";

import { CLIENT_STATUS_OPTIONS } from "../status";
import { ClientFormDialog } from "./client-form-dialog";
import type { OwnerOption } from "../types";

const ALL_STATUSES = "ALL";

export type ClientsView = "active" | "archived" | "all";

const VIEW_OPTIONS: { value: ClientsView; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export function ClientsToolbar({
  search,
  status,
  view,
  owners,
}: {
  search: string;
  status: ClientStatus | "ALL";
  view: ClientsView;
  owners: OwnerOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [term, setTerm] = useState(search);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setTerm(search);
  }, [search]);

  const pushQuery = useCallback(
    (nextTerm: string, nextStatus: string, nextView: string) => {
      const params = new URLSearchParams();
      const trimmed = nextTerm.trim();
      if (trimmed) {
        params.set("q", trimmed);
      }
      if (nextStatus !== ALL_STATUSES) {
        params.set("status", nextStatus);
      }
      if (nextView !== "active") {
        params.set("view", nextView);
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (term !== search) {
        pushQuery(term, status, view);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [term, status, view, search, pushQuery]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search clients…"
            className="pl-8"
            aria-label="Search clients"
          />
        </div>
        <Select
          value={status}
          onValueChange={(next) => pushQuery(term, next, view)}
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {CLIENT_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={view}
          onValueChange={(next) => pushQuery(term, status, next)}
        >
          <SelectTrigger className="sm:w-36" aria-label="Filter by archive state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIEW_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus />
        Add client
      </Button>
      <ClientFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        owners={owners}
      />
    </div>
  );
}
