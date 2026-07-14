/**
 * Pure routing policy for authentication. Decides, for a given path and
 * authentication state, whether to continue or redirect. Kept free of any
 * framework or runtime dependency so it can run in Edge middleware and be
 * unit-tested in isolation.
 */

export const AUTH_ROUTES = ["/login", "/signup"] as const;

/** Paths reachable without an authenticated session. */
const PUBLIC_ROUTES = new Set<string>([...AUTH_ROUTES, "/", "/forbidden"]);

export type AuthDecision =
  | { type: "next" }
  | { type: "redirect"; to: string; redirectTo?: string };

function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname);
}

export function resolveAuthAction(
  pathname: string,
  isAuthenticated: boolean,
): AuthDecision {
  // Signed-in users should never see the login/signup pages.
  if (isAuthenticated && isAuthRoute(pathname)) {
    return { type: "redirect", to: "/dashboard" };
  }

  // Default-deny: any non-public route requires authentication.
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return { type: "redirect", to: "/login", redirectTo: pathname };
  }

  return { type: "next" };
}
