import type { ClientRepository } from "../ports/client-repository";
import { ClientNotFoundError } from "../client.errors";

export class DeleteClient {
  constructor(private readonly clients: ClientRepository) {}

  async execute(id: string): Promise<void> {
    const client = await this.clients.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }

    await this.clients.delete(id);
  }
}
