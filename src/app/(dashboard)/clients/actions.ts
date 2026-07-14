"use server";

import { revalidatePath } from "next/cache";

import { ClientController } from "@backend/interface/client/client-controller";
import type { ActionResult } from "@backend/interface/shared/action-result";
import type { ClientView } from "@backend/application/client/dto";
import { clientUseCases } from "@backend/infrastructure/container";

const controller = new ClientController(clientUseCases);
const CLIENTS_PATH = "/clients";

export async function createClientAction(
  input: unknown,
): Promise<ActionResult<ClientView>> {
  const result = await controller.add(input);
  if (result.ok) {
    revalidatePath(CLIENTS_PATH);
  }
  return result;
}

export async function updateClientAction(
  input: unknown,
): Promise<ActionResult<ClientView>> {
  const result = await controller.edit(input);
  if (result.ok) {
    revalidatePath(CLIENTS_PATH);
  }
  return result;
}

export async function deleteClientAction(
  id: string,
): Promise<ActionResult<null>> {
  const result = await controller.remove(id);
  if (result.ok) {
    revalidatePath(CLIENTS_PATH);
  }
  return result;
}
