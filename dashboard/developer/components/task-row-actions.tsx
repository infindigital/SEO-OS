"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  PanelRightOpen,
  RotateCcw,
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
import type { DeveloperTaskView } from "@backend/application/developer-task/dto";

import { markTaskCompleteAction } from "@/app/(dashboard)/developer/actions";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskDetailDialog } from "./task-detail-dialog";
import type { ClientOption, DeveloperOption } from "../types";

export function TaskRowActions({
  task,
  developers,
  clients,
}: {
  task: DeveloperTaskView;
  developers: DeveloperOption[];
  clients: ClientOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleComplete() {
    const complete = task.isOpen;
    startTransition(async () => {
      const result = await markTaskCompleteAction(task.id, complete);
      if (result.ok) {
        toast.success(complete ? "Task completed." : "Task reopened.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${task.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDetailOpen(true)}>
            <PanelRightOpen />
            Details, notes &amp; screenshots
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isPending} onSelect={toggleComplete}>
            {task.isOpen ? (
              <>
                <CheckCircle2 />
                Mark complete
              </>
            ) : (
              <>
                <RotateCcw />
                Reopen
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        developers={developers}
        clients={clients}
      />
      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={task}
        developers={developers}
      />
    </>
  );
}
