import type { ClientRepository } from "../ports/client-repository";
import type { ClientView } from "../dto";
import { toClientView } from "../mapper";

/** Fetch a single client by id, or `null` when it does not exist. */
export class GetClient {
  constructor(private readonly clients: ClientRepository) {}

  async execute(id: string): Promise<ClientView | null> {
    const client = await this.clients.findById(id);
    return client ? toClientView(client) : null;
  }
}
