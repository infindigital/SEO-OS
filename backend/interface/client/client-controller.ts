import { DomainError } from "@backend/domain/shared/domain-error";
import { ApplicationError } from "@backend/application/shared/application-error";
import { ClientNotFoundError } from "@backend/application/client/client.errors";
import { isClientStatus } from "@backend/domain/client/client-status";
import type {
  ClientView,
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "@backend/application/client/dto";
import type { AddClient } from "@backend/application/client/use-cases/add-client";
import type { EditClient } from "@backend/application/client/use-cases/edit-client";
import type { DeleteClient } from "@backend/application/client/use-cases/delete-client";
import type { ArchiveClient } from "@backend/application/client/use-cases/archive-client";
import type { GetClient } from "@backend/application/client/use-cases/get-client";
import type { ListClients } from "@backend/application/client/use-cases/list-clients";
import {
  ActionResult,
  failure,
  fromZodError,
  ok,
} from "@backend/interface/shared/action-result";
import {
  archiveClientSchema,
  createClientSchema,
  updateClientSchema,
  type ClientFormValues,
} from "./client.schemas";

export interface ClientUseCases {
  add: AddClient;
  edit: EditClient;
  delete: DeleteClient;
  archive: ArchiveClient;
  get: GetClient;
  list: ListClients;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Convert an optional trimmed string field into `null` when blank. */
function textOrNull(value: string): string | null {
  return value === "" ? null : value;
}

/** Convert a validated numeric string field into a number, or `null` when blank. */
function numberOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

/** Convert a validated YYYY-MM-DD string into a UTC `Date`, or `null` when blank. */
function dateOrNull(value: string): Date | null {
  return value === "" ? null : new Date(`${value}T00:00:00.000Z`);
}

function toCreateInput(values: ClientFormValues): CreateClientInput {
  return {
    name: values.name,
    website: textOrNull(values.website),
    contactName: textOrNull(values.contactName),
    contactEmail: textOrNull(values.contactEmail),
    status: values.status,
    ownerId: textOrNull(values.ownerId),
    industry: textOrNull(values.industry),
    monthlyRetainer: numberOrNull(values.monthlyRetainer),
    seoScore: numberOrNull(values.seoScore),
    lastAuditAt: dateOrNull(values.lastAuditDate),
    currentFocus: textOrNull(values.currentFocus),
    notes: textOrNull(values.notes),
  };
}

function toUpdateInput(
  id: string,
  values: ClientFormValues,
): UpdateClientInput {
  return { id, ...toCreateInput(values) };
}

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
    return this.run(() => this.useCases.add.execute(toCreateInput(parsed.data)));
  }

  async edit(input: unknown): Promise<ActionResult<ClientView>> {
    const parsed = updateClientSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    const { id, ...values } = parsed.data;
    return this.run(() =>
      this.useCases.edit.execute(toUpdateInput(id, values)),
    );
  }

  async get(id: string): Promise<ActionResult<ClientView>> {
    return this.run(async () => {
      const client = await this.useCases.get.execute(id);
      if (!client) {
        throw new ClientNotFoundError(id);
      }
      return client;
    });
  }

  async remove(id: string): Promise<ActionResult<null>> {
    return this.run(async () => {
      await this.useCases.delete.execute(id);
      return null;
    });
  }

  async archive(input: unknown): Promise<ActionResult<ClientView>> {
    const parsed = archiveClientSchema.safeParse(input);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }
    return this.run(() =>
      this.useCases.archive.execute(parsed.data.id, parsed.data.archived),
    );
  }

  async list(query: ListClientsQuery = {}): Promise<ActionResult<ClientView[]>> {
    const normalized: ListClientsQuery = {
      search: query.search?.trim() || undefined,
      status:
        query.status && isClientStatus(query.status) ? query.status : undefined,
      includeArchived: query.includeArchived,
      archivedOnly: query.archivedOnly,
    };
    return this.run(() => this.useCases.list.execute(normalized));
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
