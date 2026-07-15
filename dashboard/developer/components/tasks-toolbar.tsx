"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DevTaskStatus } from "@backend/domain/developer-task/developer-task-status";

import { STATUS_OPTIONS } from "../status";
import { TaskFormDialog } from "./task-form-dialog";
import type { ClientOption, DeveloperOption } from "../types";

const ALL = "ALL";
const UNASSIGNED = "UNASSIGNED";

export interface TaskFilters {
  status: DevTaskStatus | "ALL";
  assignee: string; // profile id, "UNASSIGNED", or "ALL"
  view: "all" | "open";
}

export function TasksToolbar({
  filters,
  developers,
  clients,
}: {
  filters: TaskFilters;
  developers: DeveloperOption[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  const pushQuery = useCallback(
    (next: Partial<TaskFilters>) => {
      const merged = { ...filters, ...next };
      const params = new URLSearchParams();
      if (merged.status !== ALL) params.set("status", merged.status);
      if (merged.assignee !== ALL) params.set("assignee", merged.assignee);
      if (merged.view !== "all") params.set("view", merged.view);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filters.view} onValueChange={(v) => pushQuery({ view: v as TaskFilters["view"] })}>
          <SelectTrigger className="sm:w-36" aria-label="Filter by open state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open tasks</SelectItem>
            <SelectItem value="all">All tasks</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => pushQuery({ status: v as TaskFilters["status"] })}>
          <SelectTrigger className="sm:w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.assignee} onValueChange={(v) => pushQuery({ assignee: v })}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All assignees</SelectItem>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {developers.map((dev) => (
              <SelectItem key={dev.id} value={dev.id}>
                {dev.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus />
        New task
      </Button>
      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        developers={developers}
        clients={clients}
      />
    </div>
  );
}
