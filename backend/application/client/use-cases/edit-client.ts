import type { ClientRepository } from "../ports/client-repository";
import type { ClientView, UpdateClientInput } from "../dto";
import { ClientNotFoundError } from "../client.errors";
import { toClientView } from "../mapper";

export class EditClient {
  constructor(private readonly clients: ClientRepository) {}

  async execute(input: UpdateClientInput): Promise<ClientView> {
    const client = await this.clients.findById(input.id);
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }

    client.update({
      name: input.name,
      website: input.website,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      status: input.status,
      notes: input.notes,
    });

    await this.clients.update(client);
    return toClientView(client);
  }
}
