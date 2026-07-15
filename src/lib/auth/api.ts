import "server-only";

import { NextResponse } from "next/server";

import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import type { ProfileView } from "@backend/application/auth/dto";
import { authorizeAction } from "./session";

export type StaffGate =
  | { ok: true; profile: ProfileView }
  | { ok: false; response: NextResponse };

/**
 * Gate an API route to staff (admin/developer) users. On denial, returns a
 * ready-to-send JSON response with the correct status so the handler can bail
 * out early.
 */
export async function requireStaffApi(): Promise<StaffGate> {
  const auth = await authorizeAction([...STAFF_ROLES]);
  if (auth.ok) {
    return { ok: true, profile: auth.profile };
  }
  return {
    ok: false,
    response: NextResponse.json({ error: auth.error }, { status: 401 }),
  };
}

/** Translate an interface {@link ActionResult}-style failure to an HTTP status. */
export function statusForError(error: string): number {
  if (/not found/i.test(error)) {
    return 404;
  }
  if (/permission|signed in/i.test(error)) {
    return 403;
  }
  return 400;
}
