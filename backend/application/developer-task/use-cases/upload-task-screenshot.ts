import type { DeveloperTaskRepository } from "../ports/developer-task-repository";
import type { ScreenshotStorage } from "../ports/screenshot-storage";
import type { IdGenerator } from "@backend/application/client/ports/id-generator";
import type { DeveloperTaskView, UploadScreenshotInput } from "../dto";
import {
  DeveloperTaskNotFoundError,
  UnsupportedScreenshotTypeError,
} from "../developer-task.errors";
import { toDeveloperTaskView } from "../mapper";

/** Sanitize a filename for use in a storage key. */
function safeName(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "screenshot";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return cleaned.length > 0 ? cleaned : "screenshot";
}

export class UploadTaskScreenshot {
  constructor(
    private readonly tasks: DeveloperTaskRepository,
    private readonly storage: ScreenshotStorage,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: UploadScreenshotInput): Promise<DeveloperTaskView> {
    if (!input.contentType.toLowerCase().startsWith("image/")) {
      throw new UnsupportedScreenshotTypeError(input.contentType);
    }

    const task = await this.tasks.findById(input.taskId);
    if (!task) {
      throw new DeveloperTaskNotFoundError(input.taskId);
    }

    const id = this.ids.generate();
    const key = `${input.taskId}/${id}-${safeName(input.filename)}`;
    const stored = await this.storage.put({
      key,
      bytes: input.bytes,
      contentType: input.contentType,
    });

    const screenshot = task.addScreenshot({
      id,
      uploaderId: input.uploaderId ?? null,
      path: stored.path,
      url: stored.url,
      caption: input.caption ?? null,
    });

    await this.tasks.saveScreenshot(task.id, screenshot);
    return toDeveloperTaskView(task);
  }
}
