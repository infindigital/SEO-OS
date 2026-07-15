import { DeveloperTask } from "@backend/domain/developer-task/developer-task";
import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { IdGenerator } from "@backend/application/client/ports/id-generator";
import type { CreateTaskInput, DeveloperTaskView } from "../dto";
import { toDeveloperTaskView } from "../mapper";

export class CreateDeveloperTask {
  constructor(
    private readonly tasks: DeveloperTaskRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateTaskInput): Promise<DeveloperTaskView> {
    const task = DeveloperTask.create({
      id: this.ids.generate(),
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      status: input.status,
      completion: input.completion,
      dueDate: input.dueDate ?? null,
      assigneeId: input.assigneeId ?? null,
      clientId: input.clientId ?? null,
    });

    await this.tasks.create(task);
    return toDeveloperTaskView(task);
  }
}
