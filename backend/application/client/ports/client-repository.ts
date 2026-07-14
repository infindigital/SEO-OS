import type { Client } from "@backend/domain/client/client";
import type { ListClientsQuery } from "../dto";

/**
 * Port for persisting and querying clients. Implemented by the infrastructure
 * layer (e.g. a Prisma-backed repository). Use cases depend on this interface,
 * never on a concrete data store.
 */
export interface ClientRepository {
  create(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Client | null>;
  list(query: ListClientsQuery): Promise<Client[]>;
}
