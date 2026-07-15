export type FetchFn = typeof fetch;

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/**
 * Google OAuth 2.0 for Search Console: builds the consent URL, exchanges an
 * authorization code for tokens, and refreshes access tokens. `fetch` is
 * injected so the HTTP behaviour is testable.
 */
export class GoogleOAuthService {
  constructor(
    private readonly config: GoogleOAuthConfig,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: SCOPE,
      state,
    });
    return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{
    refreshToken: string | null;
    accessToken: string;
    expiresIn: number;
  }> {
    const json = await this.tokenRequest({
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });
    return {
      refreshToken: json.refresh_token ?? null,
      accessToken: json.access_token,
      expiresIn: json.expires_in,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const json = await this.tokenRequest({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    return { accessToken: json.access_token, expiresIn: json.expires_in };
  }

  private async tokenRequest(
    extra: Record<string, string>,
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      ...extra,
    });
    const response = await this.fetchFn(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Google OAuth token request failed: ${response.status} ${detail}`,
      );
    }
    return (await response.json()) as TokenResponse;
  }
}
