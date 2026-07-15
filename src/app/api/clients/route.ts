import { NextResponse } from "next/server";

import { revalidatePath } from "next/cache";

import { ClientController } from "@backend/interface/client/client-controller";
import { clientUseCases } from "@backend/infrastructure/container";
import { isClientStatus } from "@backend/domain/client/client-status";
import type { ClientStatus } from "@backend/domain/client/client-status";
import { requireStaffApi, statusForError } from "@/lib/auth/api";

export const dynamic = "force-dynamic";

const controller = new ClientController(clientUseCases);

/** GET /api/clients — list clients with optional search, status, and archive filters. */
export async function GET(request: Request): Promise<NextResponse> {
  const gate = await requireStaffApi();
  if (!gate.ok) {
    return gate.response;
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status: ClientStatus | undefined =
    statusParam && isClientStatus(statusParam) ? statusParam : undefined;

  const result = await controller.list({
    search: url.searchParams.get("q") ?? undefined,
    status,
    includeArchived: url.searchParams.get("includeArchived") === "true",
    archivedOnly: url.searchParams.get("archivedOnly") === "true",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: statusForError(result.error) },
    );
  }
  return NextResponse.json({ clients: result.data });
}

/** POST /api/clients — create a client. */
export async function POST(request: Request): Promise<NextResponse> {
  const gate = await requireStaffApi();
  if (!gate.ok) {
    return gate.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await controller.add(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: statusForError(result.error) },
    );
  }

  revalidatePath("/clients");
  return NextResponse.json({ client: result.data }, { status: 201 });
}
