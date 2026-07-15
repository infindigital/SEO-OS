import { NextResponse } from "next/server";

import { runSearchConsoleSync } from "@automations/search-console-sync";

export const dynamic = "force-dynamic";

/**
 * Scheduled Search Console sync endpoint. Protected by CRON_SECRET (sent as a
 * Bearer token or `?secret=`), so only the scheduler can trigger it.
 */
async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSearchConsoleSync();
  return NextResponse.json(result);
}

export async function GET(request: Request): Promise<NextResponse> {
  return handle(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handle(request);
}
