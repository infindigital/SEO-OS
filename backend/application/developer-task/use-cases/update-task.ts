import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { DeveloperTaskView, UpdateTaskInput } from "../dto";
import { DeveloperTaskNotFoundError } from "../developer-task.errors";
import { toDeveloperTaskView } from "../mapper";

export class UpdateDeveloperTask {
  constructor(private readonly tasks: DeveloperTaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<DeveloperTaskView> {
    const task = await this.tasks.findById(input.id);
    if (!task) {
      throw new DeveloperTaskNotFoundError(input.id);
    }

    task.update({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      completion: input.completion,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      clientId: input.clientId,
    });

    await this.tasks.update(task);
    return toDeveloperTaskView(task);
  }
}
