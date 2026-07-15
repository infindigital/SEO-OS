import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { IdGenerator } from "@backend/application/client/ports/id-generator";
import type { AddNoteInput, DeveloperTaskView } from "../dto";
import { DeveloperTaskNotFoundError } from "../developer-task.errors";
import { toDeveloperTaskView } from "../mapper";

export class AddTaskNote {
  constructor(
    private readonly tasks: DeveloperTaskRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AddNoteInput): Promise<DeveloperTaskView> {
    const task = await this.tasks.findById(input.taskId);
    if (!task) {
      throw new DeveloperTaskNotFoundError(input.taskId);
    }

    const note = task.addNote({
      id: this.ids.generate(),
      authorId: input.authorId ?? null,
      body: input.body,
    });

    await this.tasks.saveNote(task.id, note);
    return toDeveloperTaskView(task);
  }
}
