import type { ClientMemory } from "../../../domain/client-memory/client-memory";

export interface ClientMemoryStore {
  load(clientId: string): Promise<ClientMemory | null>;
  save(memory: ClientMemory): Promise<void>;
}
