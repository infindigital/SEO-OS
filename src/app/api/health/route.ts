import { NextResponse } from "next/server";

// Liveness/readiness probe for load balancers and orchestrators. Unauthenticated
// and dependency-free by design: it reports that the server process is up, not
// that downstream services are reachable, so a slow database never fails the
// probe and causes a restart loop.
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json({ status: "ok", uptime: process.uptime() });
}
