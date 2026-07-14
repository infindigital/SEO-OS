"use server";

import { revalidatePath } from "next/cache";

import { authorizeAction } from "@/lib/auth/session";
import { profileUseCases } from "@backend/infrastructure/container";
import { updateRoleSchema } from "@backend/interface/auth/auth.schemas";
import { DomainError } from "@backend/domain/shared/domain-error";
import { ApplicationError } from "@backend/application/shared/application-error";
import type { ProfileView } from "@backend/application/auth/dto";
import {
  type ActionResult,
  failure,
  fromZodError,
  ok,
} from "@backend/interface/shared/action-result";

export async function updateUserRoleAction(
  input: unknown,
): Promise<ActionResult<ProfileView>> {
  const auth = await authorizeAction(["ADMIN"]);
  if (!auth.ok) {
    return failure(auth.error);
  }

  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  try {
    const profile = await profileUseCases.updateRole.execute(parsed.data);
    revalidatePath("/admin");
    return ok(profile);
  } catch (error) {
    if (error instanceof DomainError || error instanceof ApplicationError) {
      return failure(error.message);
    }
    console.error("[updateUserRoleAction] unexpected error", error);
    return failure("Something went wrong. Please try again.");
  }
}
