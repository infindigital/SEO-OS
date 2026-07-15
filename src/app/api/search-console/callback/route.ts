import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { searchConsole } from "@backend/infrastructure/container";

export const dynamic = "force-dynamic";

interface OAuthState {
  clientId: string;
  siteUrl: string;
}

/** OAuth redirect target: exchange the code for tokens and store the connection. */
export async function GET(request: Request): Promise<NextResponse> {
  await requireRole([...STAFF_ROLES]);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state." },
      { status: 400 },
    );
  }

  let decoded: OAuthState;
  try {
    decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as OAuthState;
  } catch {
    return NextResponse.json({ error: "Invalid state." }, { status: 400 });
  }

  const tokens = await searchConsole.oauth.exchangeCode(code);
  if (!tokens.refreshToken) {
    return NextResponse.json(
      { error: "No refresh token returned by Google; re-consent is required." },
      { status: 400 },
    );
  }

  await searchConsole.repository.upsertConnection({
    clientId: decoded.clientId,
    siteUrl: decoded.siteUrl,
    refreshToken: tokens.refreshToken,
  });

  return NextResponse.redirect(new URL("/clients", url.origin));
}
