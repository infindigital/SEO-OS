import type {
  DeveloperTask,
  TaskNote,
  TaskScreenshot,
} from "@backend/domain/developer-task/developer-task";
import type { ListTasksQuery } from "../dto";

/**
 * Port for persisting and querying developer tasks. The aggregate owns its
 * notes and screenshots; `saveNote` / `saveScreenshot` append a single child
 * without rewriting the whole task.
 */
export interface DeveloperTaskRepository {
  create(task: DeveloperTask): Promise<void>;
  update(task: DeveloperTask): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<DeveloperTask | null>;
  list(query: ListTasksQuery): Promise<DeveloperTask[]>;
  saveNote(taskId: string, note: TaskNote): Promise<void>;
  saveScreenshot(taskId: string, screenshot: TaskScreenshot): Promise<void>;
}
