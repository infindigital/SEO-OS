import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import {
  isDevTaskStatus,
  type DevTaskStatus,
} from "@backend/domain/developer-task/developer-task-status";
import type { ListTasksQuery } from "@backend/application/developer-task/dto";
import {
  clientUseCases,
  developerTaskUseCases,
  profileUseCases,
} from "@backend/infrastructure/container";
import { requireRole } from "@/lib/auth/session";
import { DeveloperBoardCards } from "@dashboard/developer/components/developer-board-cards";
import { TasksTable } from "@dashboard/developer/components/tasks-table";
import {
  TasksToolbar,
  type TaskFilters,
} from "@dashboard/developer/components/tasks-toolbar";
import type { ClientOption, DeveloperOption } from "@dashboard/developer/types";

export const dynamic = "force-dynamic";

const ALL = "ALL";
const UNASSIGNED = "UNASSIGNED";

export default async function DeveloperDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignee?: string; view?: string }>;
}) {
  await requireRole([...STAFF_ROLES]);

  const params = await searchParams;
  const status: DevTaskStatus | undefined =
    params.status && isDevTaskStatus(params.status) ? params.status : undefined;
  const view: TaskFilters["view"] = params.view === "all" ? "all" : "open";
  const assignee = params.assignee ?? ALL;

  const query: ListTasksQuery = { status, openOnly: view === "open" };
  if (assignee !== ALL && assignee !== UNASSIGNED) {
    query.assigneeId = assignee;
  }

  const [rawTasks, summary, profiles, clientList] = await Promise.all([
    developerTaskUseCases.list.execute(query),
    developerTaskUseCases.boardSummary.execute(),
    profileUseCases.list.execute(),
    clientUseCases.list.execute({}),
  ]);

  const tasks =
    assignee === UNASSIGNED
      ? rawTasks.filter((task) => task.assigneeId === null)
      : rawTasks;

  const developers: DeveloperOption[] = profiles
    .filter((profile) => (STAFF_ROLES as readonly string[]).includes(profile.role))
    .map((profile) => ({ id: profile.id, label: profile.email }));

  const clients: ClientOption[] = clientList.map((client) => ({
    id: client.id,
    label: client.name,
  }));

  const filters: TaskFilters = {
    status: status ?? "ALL",
    assignee,
    view,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Developer Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Track engineering work: priority, due dates, progress, and delivery.
        </p>
      </div>

      <DeveloperBoardCards summary={summary} />
      <TasksToolbar filters={filters} developers={developers} clients={clients} />
      <TasksTable tasks={tasks} developers={developers} clients={clients} />
    </div>
  );
}
