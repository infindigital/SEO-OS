import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { ClientMemory } from "../../domain/client-memory/client-memory";
import type { ClientMemoryStore } from "../../application/client-memory/ports/client-memory-store";

/** Client memory persisted to `<baseDir>/<clientId>/memory.json`. */
export class FileClientMemoryStore implements ClientMemoryStore {
  constructor(private readonly baseDir = "clients") {}

  private pathFor(clientId: string): string {
    const safe = clientId.replace(/[^a-z0-9._-]/gi, "_");
    return join(this.baseDir, safe, "memory.json");
  }

  async load(clientId: string): Promise<ClientMemory | null> {
    try {
      const raw = await readFile(this.pathFor(clientId), "utf8");
      return JSON.parse(raw) as ClientMemory;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async save(memory: ClientMemory): Promise<void> {
    const path = this.pathFor(memory.clientId);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(memory, null, 2)}\n`, "utf8");
  }
}
