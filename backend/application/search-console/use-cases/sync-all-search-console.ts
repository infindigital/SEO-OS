import type { SearchConsoleRepository } from "../ports/search-console-repository";
import type { SyncAllResult, SyncOptions, SyncResult } from "../dto";
import type { SyncSearchConsole } from "./sync-search-console";

/**
 * Sync every connected property. Failures are isolated per connection so one
 * bad connection does not abort the rest; failed connections are marked ERROR.
 */
export class SyncAllSearchConsole {
  constructor(
    private readonly repository: SearchConsoleRepository,
    private readonly syncOne: SyncSearchConsole,
  ) {}

  async execute(options: SyncOptions = {}): Promise<SyncAllResult> {
    const connections = await this.repository.listConnections();
    const results: SyncResult[] = [];
    const errors: { connectionId: string; error: string }[] = [];

    for (const connection of connections) {
      try {
        results.push(await this.syncOne.execute(connection.id, options));
      } catch (error) {
        errors.push({
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error),
        });
        try {
          await this.repository.setStatus(connection.id, "ERROR");
        } catch {
          // Ignore status-update failures.
        }
      }
    }

    return {
      connections: connections.length,
      synced: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}
