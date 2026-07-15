import type { DeveloperTask } from "@backend/domain/developer-task/developer-task";
import type { DeveloperTaskRepository } from "@backend/application/developer-task/ports/developer-task-repository";
import type { ListTasksQuery } from "@backend/application/developer-task/dto";

/**
 * In-memory {@link DeveloperTaskRepository} for unit tests. The aggregate is
 * mutated in place, so `saveNote` / `saveScreenshot` are no-ops — the stored
 * task already reflects the change made by the use case.
 */
export class InMemoryDeveloperTaskRepository implements DeveloperTaskRepository {
  private readonly store = new Map<string, DeveloperTask>();

  async create(task: DeveloperTask): Promise<void> {
    this.store.set(task.id, task);
  }

  async update(task: DeveloperTask): Promise<void> {
    this.store.set(task.id, task);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findById(id: string): Promise<DeveloperTask | null> {
    return this.store.get(id) ?? null;
  }

  async list(query: ListTasksQuery): Promise<DeveloperTask[]> {
    return [...this.store.values()]
      .filter((task) => {
        if (query.status && task.status !== query.status) {
          return false;
        }
        if (!query.status && query.openOnly && !task.isOpen) {
          return false;
        }
        if (query.assigneeId && task.assigneeId !== query.assigneeId) {
          return false;
        }
        if (query.clientId && task.clientId !== query.clientId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async saveNote(): Promise<void> {}

  async saveScreenshot(): Promise<void> {}
}
