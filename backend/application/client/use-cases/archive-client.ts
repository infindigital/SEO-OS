import type { ClientRepository } from "../ports/client-repository";
import type { ClientView } from "../dto";
import { ClientNotFoundError } from "../client.errors";
import { toClientView } from "../mapper";

/** Archive or restore a client (soft hide, preserving its data). */
export class ArchiveClient {
  constructor(private readonly clients: ClientRepository) {}

  async execute(id: string, archived: boolean): Promise<ClientView> {
    const client = await this.clients.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }

    if (archived) {
      client.archive();
    } else {
      client.unarchive();
    }

    await this.clients.update(client);
    return toClientView(client);
  }
}
