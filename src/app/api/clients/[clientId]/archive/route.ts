import { NextResponse } from "next/server";

import { revalidatePath } from "next/cache";

import { ClientController } from "@backend/interface/client/client-controller";
import { clientUseCases } from "@backend/infrastructure/container";
import { requireStaffApi, statusForError } from "@/lib/auth/api";

export const dynamic = "force-dynamic";

const controller = new ClientController(clientUseCases);

type Context = { params: Promise<{ clientId: string }> };

/**
 * POST /api/clients/:clientId/archive — archive or restore a client.
 * Body: `{ "archived": boolean }` (defaults to archiving when omitted).
 */
export async function POST(
  request: Request,
  { params }: Context,
): Promise<NextResponse> {
  const gate = await requireStaffApi();
  if (!gate.ok) {
    return gate.response;
  }

  let archived = true;
  try {
    const body = (await request.json()) as { archived?: unknown };
    if (typeof body.archived === "boolean") {
      archived = body.archived;
    }
  } catch {
    // No/invalid body — default to archiving.
  }

  const { clientId } = await params;
  const result = await controller.archive({ id: clientId, archived });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: statusForError(result.error) },
    );
  }

  revalidatePath("/clients");
  return NextResponse.json({ client: result.data });
}
