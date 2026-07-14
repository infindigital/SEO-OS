import type { ClientRepository } from "../ports/client-repository";
import type { ClientView, ListClientsQuery } from "../dto";
import { toClientView } from "../mapper";

export class ListClients {
  constructor(private readonly clients: ClientRepository) {}

  async execute(query: ListClientsQuery = {}): Promise<ClientView[]> {
    const clients = await this.clients.list(query);
    return clients.map(toClientView);
  }
}
