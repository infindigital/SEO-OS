import type {
  ConnectionStatus,
  SearchConsoleConnection,
} from "@backend/domain/search-console/connection";
import type {
  AnalyticsRowInput,
  CoverageInput,
  SearchConsoleRepository,
  UpsertConnectionInput,
} from "@backend/application/search-console/ports/search-console-repository";

/** In-memory {@link SearchConsoleRepository} for unit tests. */
export class InMemorySearchConsoleRepository
  implements SearchConsoleRepository
{
  private readonly connections = new Map<string, SearchConsoleConnection>();
  readonly analyticsRows = new Map<string, AnalyticsRowInput[]>();
  readonly coverageRows = new Map<string, CoverageInput[]>();
  private sequence = 0;

  seed(connection: SearchConsoleConnection): void {
    this.connections.set(connection.id, connection);
  }

  async listConnections(): Promise<SearchConsoleConnection[]> {
    return [...this.connections.values()].filter(
      (c) => c.status === "CONNECTED" && c.refreshToken !== null,
    );
  }

  async getConnection(id: string): Promise<SearchConsoleConnection | null> {
    return this.connections.get(id) ?? null;
  }

  async upsertConnection(
    input: UpsertConnectionInput,
  ): Promise<SearchConsoleConnection> {
    const existing = [...this.connections.values()].find(
      (c) => c.clientId === input.clientId && c.siteUrl === input.siteUrl,
    );
    const connection: SearchConsoleConnection = {
      id: existing?.id ?? `conn-${(this.sequence += 1)}`,
      clientId: input.clientId,
      siteUrl: input.siteUrl,
      refreshToken: input.refreshToken,
      status: "CONNECTED",
      lastSyncedAt: existing?.lastSyncedAt ?? null,
    };
    this.connections.set(connection.id, connection);
    return connection;
  }

  async upsertAnalyticsRows(
    connectionId: string,
    rows: AnalyticsRowInput[],
  ): Promise<number> {
    const existing = this.analyticsRows.get(connectionId) ?? [];
    this.analyticsRows.set(connectionId, [...existing, ...rows]);
    return rows.length;
  }

  async upsertCoverage(
    connectionId: string,
    rows: CoverageInput[],
  ): Promise<number> {
    this.coverageRows.set(connectionId, rows);
    return rows.length;
  }

  async markSynced(connectionId: string, at: Date): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastSyncedAt = at;
      connection.status = "CONNECTED";
    }
  }

  async setStatus(
    connectionId: string,
    status: ConnectionStatus,
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = status;
    }
  }
}
