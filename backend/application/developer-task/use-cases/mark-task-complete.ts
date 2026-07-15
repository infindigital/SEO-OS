import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { DeveloperTaskView } from "../dto";
import { DeveloperTaskNotFoundError } from "../developer-task.errors";
import { toDeveloperTaskView } from "../mapper";

/** Mark a task complete (100% / DONE) or reopen it. */
export class MarkTaskComplete {
  constructor(private readonly tasks: DeveloperTaskRepository) {}

  async execute(id: string, complete: boolean): Promise<DeveloperTaskView> {
    const task = await this.tasks.findById(id);
    if (!task) {
      throw new DeveloperTaskNotFoundError(id);
    }

    if (complete) {
      task.markComplete();
    } else {
      task.reopen();
    }

    await this.tasks.update(task);
    return toDeveloperTaskView(task);
  }
}
