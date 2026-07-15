export type ConnectionStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";

/** A connected Search Console property for a client. */
export interface SearchConsoleConnection {
  id: string;
  clientId: string;
  siteUrl: string;
  refreshToken: string | null;
  status: ConnectionStatus;
  lastSyncedAt: Date | null;
}
