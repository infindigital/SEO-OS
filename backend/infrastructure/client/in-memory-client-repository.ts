import type { Client } from "@backend/domain/client/client";
import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import type { ListClientsQuery } from "@backend/application/client/dto";

/**
 * In-memory implementation of the {@link ClientRepository} port. Used for unit
 * tests and local experimentation without a database.
 */
export class InMemoryClientRepository implements ClientRepository {
  private readonly store = new Map<string, Client>();

  async create(client: Client): Promise<void> {
    this.store.set(client.id, client);
  }

  async update(client: Client): Promise<void> {
    this.store.set(client.id, client);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findById(id: string): Promise<Client | null> {
    return this.store.get(id) ?? null;
  }

  async list(query: ListClientsQuery): Promise<Client[]> {
    const search = query.search?.trim().toLowerCase();

    return [...this.store.values()]
      .filter((client) => {
        if (query.status && client.status !== query.status) {
          return false;
        }
        if (search) {
          const haystack = [
            client.name,
            client.website,
            client.contactName,
            client.contactEmail,
          ]
            .filter((value): value is string => value !== null)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(search)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
