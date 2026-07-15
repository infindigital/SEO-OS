"use server";

import { revalidatePath } from "next/cache";

import { ClientPortalController } from "@backend/interface/client-portal/client-portal-controller";
import {
  type ActionResult,
  failure,
} from "@backend/interface/shared/action-result";
import type { PortalReport } from "@backend/application/client-portal/dto";
import { clientPortalUseCases } from "@backend/infrastructure/container";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { authorizeAction } from "@/lib/auth/session";

const controller = new ClientPortalController(clientPortalUseCases);

/** Publish a client-facing report. Staff only. */
export async function publishReportAction(
  input: unknown,
): Promise<ActionResult<PortalReport>> {
  const auth = await authorizeAction([...STAFF_ROLES]);
  if (!auth.ok) {
    return failure(auth.error);
  }

  const result = await controller.publishReport(input);
  if (result.ok) {
    revalidatePath("/portal");
  }
  return result;
}
