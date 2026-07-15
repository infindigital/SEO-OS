import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { searchConsole } from "@backend/infrastructure/container";

export const dynamic = "force-dynamic";

/**
 * Start the Google Search Console OAuth flow for a client + property. Redirects
 * the (staff) user to Google's consent screen; the callback stores the tokens.
 */
export async function GET(request: Request): Promise<NextResponse> {
  await requireRole([...STAFF_ROLES]);

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");
  const siteUrl = url.searchParams.get("siteUrl");

  if (!clientId || !siteUrl) {
    return NextResponse.json(
      { error: "clientId and siteUrl query parameters are required." },
      { status: 400 },
    );
  }

  const state = Buffer.from(JSON.stringify({ clientId, siteUrl })).toString(
    "base64url",
  );
  return NextResponse.redirect(searchConsole.oauth.buildAuthorizeUrl(state));
}
