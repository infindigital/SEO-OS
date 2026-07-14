"use server";

import { revalidatePath } from "next/cache";

import { ClientController } from "@backend/interface/client/client-controller";
import {
  type ActionResult,
  failure,
} from "@backend/interface/shared/action-result";
import type { ClientView } from "@backend/application/client/dto";
import { clientUseCases } from "@backend/infrastructure/container";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { authorizeAction } from "@/lib/auth/session";

const controller = new ClientController(clientUseCases);
const CLIENTS_PATH = "/clients";

async function ensureStaff(): Promise<ActionResult<never> | null> {
  const auth = await authorizeAction([...STAFF_ROLES]);
  return auth.ok ? null : failure(auth.error);
}

export async function createClientAction(
  input: unknown,
): Promise<ActionResult<ClientView>> {
  const denied = await ensureStaff();
  if (denied) {
    return denied;
  }

  const result = await controller.add(input);
  if (result.ok) {
    revalidatePath(CLIENTS_PATH);
  }
  return result;
}

export async function updateClientAction(
  input: unknown,
): Promise<ActionResult<ClientView>> {
  const denied = await ensureStaff();
  if (denied) {
    return denied;
  }

  const result = await controller.edit(input);
  if (result.ok) {
    revalidatePath(CLIENTS_PATH);
  }
  return result;
}

export async function deleteClientAction(
  id: string,
): Promise<ActionResult<null>> {
  const denied = await ensureStaff();
  if (denied) {
    return denied;
  }

  const result = await controller.remove(id);
  if (result.ok) {
    revalidatePath(CLIENTS_PATH);
  }
  return result;
}
