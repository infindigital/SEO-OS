import { NextResponse } from "next/server";

import { revalidatePath } from "next/cache";

import { ClientController } from "@backend/interface/client/client-controller";
import { clientUseCases } from "@backend/infrastructure/container";
import { requireStaffApi, statusForError } from "@/lib/auth/api";

export const dynamic = "force-dynamic";

const controller = new ClientController(clientUseCases);

type Context = { params: Promise<{ clientId: string }> };

/** GET /api/clients/:clientId — fetch a single client. */
export async function GET(
  _request: Request,
  { params }: Context,
): Promise<NextResponse> {
  const gate = await requireStaffApi();
  if (!gate.ok) {
    return gate.response;
  }

  const { clientId } = await params;
  const result = await controller.get(clientId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: statusForError(result.error) },
    );
  }
  return NextResponse.json({ client: result.data });
}

/** PATCH /api/clients/:clientId — update a client. */
export async function PATCH(
  request: Request,
  { params }: Context,
): Promise<NextResponse> {
  const gate = await requireStaffApi();
  if (!gate.ok) {
    return gate.response;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId } = await params;
  const result = await controller.edit({ ...body, id: clientId });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: statusForError(result.error) },
    );
  }

  revalidatePath("/clients");
  return NextResponse.json({ client: result.data });
}

/** DELETE /api/clients/:clientId — permanently remove a client. */
export async function DELETE(
  _request: Request,
  { params }: Context,
): Promise<NextResponse> {
  const gate = await requireStaffApi();
  if (!gate.ok) {
    return gate.response;
  }

  const { clientId } = await params;
  const result = await controller.remove(clientId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: statusForError(result.error) },
    );
  }

  revalidatePath("/clients");
  return NextResponse.json({ success: true });
}
