import { describe, expect, it } from "vitest";

import { GoogleOAuthService, type FetchFn } from "./google-oauth";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const config = {
  clientId: "cid",
  clientSecret: "secret",
  redirectUri: "https://app/cb",
};

describe("GoogleOAuthService", () => {
  it("builds an authorize URL with offline access and the readonly scope", () => {
    const service = new GoogleOAuthService(config, (async () =>
      jsonResponse({})) as FetchFn);
    const url = new URL(service.buildAuthorizeUrl("state123"));

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")).toContain("webmasters.readonly");
    expect(url.searchParams.get("state")).toBe("state123");
  });

  it("exchanges an authorization code for tokens", async () => {
    let capturedBody = "";
    const fetchFn: FetchFn = async (_url, init) => {
      capturedBody = String(init?.body);
      return jsonResponse({
        access_token: "at",
        refresh_token: "rt",
        expires_in: 3600,
      });
    };
    const service = new GoogleOAuthService(config, fetchFn);

    const result = await service.exchangeCode("the-code");

    expect(result).toEqual({
      refreshToken: "rt",
      accessToken: "at",
      expiresIn: 3600,
    });
    expect(capturedBody).toContain("grant_type=authorization_code");
    expect(capturedBody).toContain("code=the-code");
  });

  it("refreshes an access token", async () => {
    const fetchFn: FetchFn = async () =>
      jsonResponse({ access_token: "new", expires_in: 3599 });
    const service = new GoogleOAuthService(config, fetchFn);

    expect(await service.refreshAccessToken("rt")).toEqual({
      accessToken: "new",
      expiresIn: 3599,
    });
  });

  it("throws on a non-ok token response", async () => {
    const fetchFn: FetchFn = async () => new Response("bad", { status: 400 });
    const service = new GoogleOAuthService(config, fetchFn);

    await expect(service.refreshAccessToken("rt")).rejects.toThrow(/failed/);
  });
});
