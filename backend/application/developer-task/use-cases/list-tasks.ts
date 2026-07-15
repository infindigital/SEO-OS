import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { DeveloperTaskView, ListTasksQuery } from "../dto";
import { toDeveloperTaskView } from "../mapper";

export class ListDeveloperTasks {
  constructor(private readonly tasks: DeveloperTaskRepository) {}

  async execute(query: ListTasksQuery = {}): Promise<DeveloperTaskView[]> {
    const tasks = await this.tasks.list(query);
    return tasks.map(toDeveloperTaskView);
  }
}
