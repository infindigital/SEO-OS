"use server";

import { revalidatePath } from "next/cache";

import { DeveloperTaskController } from "@backend/interface/developer-task/developer-task-controller";
import {
  type ActionResult,
  failure,
} from "@backend/interface/shared/action-result";
import type { DeveloperTaskView } from "@backend/application/developer-task/dto";
import { developerTaskUseCases } from "@backend/infrastructure/container";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { authorizeAction } from "@/lib/auth/session";

const controller = new DeveloperTaskController(developerTaskUseCases);
const DEVELOPER_PATH = "/developer";

/** Max screenshot size accepted for upload (5 MB). */
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

type StaffAuth =
  | { ok: true; profileId: string }
  | { ok: false; result: ActionResult<never> };

async function ensureStaff(): Promise<StaffAuth> {
  const auth = await authorizeAction([...STAFF_ROLES]);
  if (!auth.ok) {
    return { ok: false, result: failure(auth.error) };
  }
  return { ok: true, profileId: auth.profile.id };
}

export async function createTaskAction(
  input: unknown,
): Promise<ActionResult<DeveloperTaskView>> {
  const auth = await ensureStaff();
  if (!auth.ok) {
    return auth.result;
  }
  const result = await controller.add(input);
  if (result.ok) {
    revalidatePath(DEVELOPER_PATH);
  }
  return result;
}

export async function updateTaskAction(
  input: unknown,
): Promise<ActionResult<DeveloperTaskView>> {
  const auth = await ensureStaff();
  if (!auth.ok) {
    return auth.result;
  }
  const result = await controller.edit(input);
  if (result.ok) {
    revalidatePath(DEVELOPER_PATH);
  }
  return result;
}

export async function markTaskCompleteAction(
  id: string,
  complete: boolean,
): Promise<ActionResult<DeveloperTaskView>> {
  const auth = await ensureStaff();
  if (!auth.ok) {
    return auth.result;
  }
  const result = await controller.setComplete({ id, complete });
  if (result.ok) {
    revalidatePath(DEVELOPER_PATH);
  }
  return result;
}

export async function addTaskNoteAction(
  input: unknown,
): Promise<ActionResult<DeveloperTaskView>> {
  const auth = await ensureStaff();
  if (!auth.ok) {
    return auth.result;
  }
  const result = await controller.addNote(input, auth.profileId);
  if (result.ok) {
    revalidatePath(DEVELOPER_PATH);
  }
  return result;
}

export async function uploadScreenshotAction(
  formData: FormData,
): Promise<ActionResult<DeveloperTaskView>> {
  const auth = await ensureStaff();
  if (!auth.ok) {
    return auth.result;
  }

  const taskId = formData.get("taskId");
  const caption = formData.get("caption");
  const file = formData.get("file");

  if (typeof taskId !== "string") {
    return failure("A task is required.");
  }
  if (!(file instanceof File) || file.size === 0) {
    return failure("Choose an image to upload.");
  }
  if (!file.type.toLowerCase().startsWith("image/")) {
    return failure("Only image files can be uploaded.");
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return failure("Image is too large (max 5 MB).");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await controller.uploadScreenshot(
    {
      taskId,
      caption: typeof caption === "string" ? caption : "",
      filename: file.name || "screenshot.png",
      contentType: file.type,
      bytes,
    },
    auth.profileId,
  );
  if (result.ok) {
    revalidatePath(DEVELOPER_PATH);
  }
  return result;
}
