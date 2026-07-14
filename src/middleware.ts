import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { resolveAuthAction } from "@backend/interface/auth/auth-routing";

export async function middleware(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);
  const decision = resolveAuthAction(request.nextUrl.pathname, isAuthenticated);

  if (decision.type === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.to;
    url.search = "";
    if (decision.redirectTo) {
      url.searchParams.set("redirectTo", decision.redirectTo);
    }

    const redirectResponse = NextResponse.redirect(url);
    // Carry over any refreshed auth cookies onto the redirect.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image files so that the
     * session is refreshed on every navigable route.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
