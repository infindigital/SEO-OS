import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { clientPortalUseCases } from "@backend/infrastructure/container";
import { requireUser } from "@/lib/auth/session";
import { PortalView } from "@dashboard/portal/components/portal-view";

export const dynamic = "force-dynamic";

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Client Portal</h1>
        <p className="text-muted-foreground text-sm">
          Your SEO progress at a glance.
        </p>
      </div>
      <div className="bg-muted text-muted-foreground rounded-md px-4 py-8 text-center text-sm">
        <p className="font-medium">{title}</p>
        <p className="mt-1">{body}</p>
      </div>
    </div>
  );
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const profile = await requireUser();
  const isStaff = (STAFF_ROLES as readonly string[]).includes(profile.role);

  let clientId: string | null = null;
  if (isStaff) {
    const param = (await searchParams).clientId;
    clientId = typeof param === "string" && param.length > 0 ? param : null;
  } else {
    // A client only ever resolves to their own workspace (by contact email).
    const resolved = await clientPortalUseCases.resolveForEmail.execute(profile.email);
    clientId = resolved?.id ?? null;
  }

  if (!clientId) {
    return isStaff ? (
      <EmptyState
        title="Preview a client portal"
        body="Open a client from the Clients page to preview their portal."
      />
    ) : (
      <EmptyState
        title="No workspace linked yet"
        body="Your account isn't linked to a client workspace. Please contact your account manager."
      />
    );
  }

  const portal = await clientPortalUseCases.getPortal.execute(clientId);
  if (!portal) {
    return (
      <EmptyState
        title="Client not found"
        body="This client workspace could not be loaded."
      />
    );
  }

  return <PortalView portal={portal} canPublish={isStaff} />;
}
