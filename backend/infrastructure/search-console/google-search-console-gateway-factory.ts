import type {
  GatewayCredentials,
  SearchConsoleGatewayFactory,
} from "@backend/application/search-console/ports/search-console-gateway-factory";
import type { SearchConsoleGateway } from "@backend/application/search-console/ports/search-console-gateway";
import type { FetchFn, GoogleOAuthService } from "./google-oauth";
import { GoogleSearchConsoleGateway } from "./google-search-console-gateway";

const TOKEN_REFRESH_MARGIN_MS = 60_000;

/**
 * Builds a Google gateway per connection, with a per-gateway access-token cache
 * that refreshes from the connection's refresh token as needed.
 */
export class GoogleSearchConsoleGatewayFactory
  implements SearchConsoleGatewayFactory
{
  constructor(
    private readonly oauth: GoogleOAuthService,
    private readonly fetchFn: FetchFn = fetch,
    private readonly nowMs: () => number = () => Date.now(),
  ) {}

  create(credentials: GatewayCredentials): SearchConsoleGateway {
    let cached: { token: string; expiresAt: number } | null = null;

    const getAccessToken = async (): Promise<string> => {
      const now = this.nowMs();
      if (cached && cached.expiresAt > now + TOKEN_REFRESH_MARGIN_MS) {
        return cached.token;
      }
      const { accessToken, expiresIn } = await this.oauth.refreshAccessToken(
        credentials.refreshToken,
      );
      cached = { token: accessToken, expiresAt: now + expiresIn * 1000 };
      return accessToken;
    };

    return new GoogleSearchConsoleGateway(getAccessToken, this.fetchFn);
  }
}
