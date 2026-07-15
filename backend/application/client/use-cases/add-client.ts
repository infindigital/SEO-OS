import { Client } from "@backend/domain/client/client";
import type { ClientRepository } from "../ports/client-repository";
import type { IdGenerator } from "../ports/id-generator";
import type { ClientView, CreateClientInput } from "../dto";
import { toClientView } from "../mapper";

export class AddClient {
  constructor(
    private readonly clients: ClientRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateClientInput): Promise<ClientView> {
    const client = Client.create({
      id: this.ids.generate(),
      name: input.name,
      website: input.website ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      status: input.status,
      ownerId: input.ownerId ?? null,
      industry: input.industry ?? null,
      monthlyRetainer: input.monthlyRetainer ?? null,
      seoScore: input.seoScore ?? null,
      lastAuditAt: input.lastAuditAt ?? null,
      currentFocus: input.currentFocus ?? null,
      notes: input.notes ?? null,
    });

    await this.clients.create(client);
    return toClientView(client);
  }
}
