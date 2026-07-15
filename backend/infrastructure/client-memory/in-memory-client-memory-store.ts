import type { ClientMemory } from "../../domain/client-memory/client-memory";
import type { ClientMemoryStore } from "../../application/client-memory/ports/client-memory-store";

/** In-memory {@link ClientMemoryStore} for unit tests. */
export class InMemoryClientMemoryStore implements ClientMemoryStore {
  private readonly store = new Map<string, ClientMemory>();

  async load(clientId: string): Promise<ClientMemory | null> {
    const memory = this.store.get(clientId);
    return memory ? structuredClone(memory) : null;
  }

  async save(memory: ClientMemory): Promise<void> {
    this.store.set(memory.clientId, structuredClone(memory));
  }
}
