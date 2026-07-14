import { DomainError } from "@backend/domain/shared/domain-error";
import { ApplicationError } from "@backend/application/shared/application-error";
import type { ClientView } from "@backend/application/client/dto";
import type { AddClient } from "@backend/application/client/use-cases/add-client";
import type { EditClient } from "@backend/application/client/use-cases/edit-client";
import type { DeleteClient } from "@backend/application/client/use-cases/delete-client";
import type { ListClients } from "@backend/application/client/use-cases/list-clients";
import {
  ActionResult,
  failure,
  fromZodError,
  ok,
} from "@backend/interface/shared/action-result";
import { createClientSchema, updateClientSchema } from "./client.schemas";

export interface ClientUseCases {
  add: AddClient;
  edit: EditClient;
  delete: DeleteClient;
  list: ListClients;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Interface adapter for client operations. Validates untrusted input, delegates
 * to application use cases, and translates domain/application errors into a
 * transport-agnostic {@link ActionResult}.
 */
export class ClientController {
  constructor(private readonly useCases: ClientUseCases) {}

  async add(input: unknown): Promise<ActionResult<ClientView>> {
    const parsed = createClientSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() => this.useCases.add.execute(parsed.data));
  }

  async edit(input: unknown): Promise<ActionResult<ClientView>> {
    const parsed = updateClientSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() => this.useCases.edit.execute(parsed.data));
  }

  async remove(id: string): Promise<ActionResult<null>> {
    return this.run(async () => {
      await this.useCases.delete.execute(id);
      return null;
    });
  }

  private async run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
    try {
      return ok(await fn());
    } catch (error) {
      if (error instanceof DomainError || error instanceof ApplicationError) {
        return failure(error.message);
      }
      console.error("[ClientController] unexpected error", error);
      return failure(GENERIC_ERROR);
    }
  }
}
