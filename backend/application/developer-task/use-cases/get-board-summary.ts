import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { DeveloperBoardSummary } from "../dto";

/** Headline KPIs for the developer dashboard cards. */
export class GetDeveloperBoardSummary {
  constructor(private readonly tasks: DeveloperTaskRepository) {}

  async execute(now: Date = new Date()): Promise<DeveloperBoardSummary> {
    const tasks = await this.tasks.list({});

    const openTasks = tasks.filter((task) => task.isOpen);
    const completedTasks = tasks.filter((task) => task.status === "DONE");
    const overdueTasks = openTasks.filter(
      (task) => task.dueDate !== null && task.dueDate.getTime() < now.getTime(),
    );
    const averageCompletion =
      tasks.length > 0
        ? Math.round(
            tasks.reduce((sum, task) => sum + task.completion, 0) / tasks.length,
          )
        : 0;

    return {
      totalTasks: tasks.length,
      openTasks: openTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      averageCompletion,
    };
  }
}
