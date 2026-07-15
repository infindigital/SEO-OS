import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeveloperTaskView } from "@backend/application/developer-task/dto";

import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { CompletionBar } from "./completion-bar";
import { TaskRowActions } from "./task-row-actions";
import { formatDateOrDash, isOverdue } from "../lib";
import type { ClientOption, DeveloperOption } from "../types";

export function TasksTable({
  tasks,
  developers,
  clients,
}: {
  tasks: DeveloperTaskView[];
  developers: DeveloperOption[];
  clients: ClientOption[];
}) {
  const developerLabels = new Map(developers.map((dev) => [dev.id, dev.label]));
  const clientLabels = new Map(clients.map((client) => [client.id, client.label]));

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead className="w-[52px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.isOpen);
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      {task.clientId && (
                        <div className="text-muted-foreground text-xs">
                          {clientLabels.get(task.clientId) ?? "Client"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.assigneeId ? (
                        (developerLabels.get(task.assigneeId) ?? "—")
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        overdue
                          ? "text-destructive text-sm font-medium"
                          : "text-muted-foreground text-sm"
                      }
                    >
                      {formatDateOrDash(task.dueDate)}
                      {overdue && <span className="ml-1">(overdue)</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <CompletionBar value={task.completion} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TaskRowActions
                        task={task}
                        developers={developers}
                        clients={clients}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
