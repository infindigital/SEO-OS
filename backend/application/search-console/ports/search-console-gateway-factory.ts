import type { SearchConsoleGateway } from "./search-console-gateway";

export interface GatewayCredentials {
  siteUrl: string;
  refreshToken: string;
}

/**
 * Creates a {@link SearchConsoleGateway} bound to a single connection's
 * credentials (each connection authenticates with its own refresh token).
 */
export interface SearchConsoleGatewayFactory {
  create(credentials: GatewayCredentials): SearchConsoleGateway;
}
