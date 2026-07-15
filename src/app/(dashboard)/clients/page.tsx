import { isClientStatus } from "@backend/domain/client/client-status";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { clientUseCases, profileUseCases } from "@backend/infrastructure/container";
import { requireRole } from "@/lib/auth/session";
import { ClientPortfolioCards } from "@dashboard/clients/components/client-portfolio-cards";
import { ClientsTable } from "@dashboard/clients/components/clients-table";
import {
  ClientsToolbar,
  type ClientsView,
} from "@dashboard/clients/components/clients-toolbar";
import type { OwnerOption } from "@dashboard/clients/types";

export const dynamic = "force-dynamic";

function resolveView(value: string | undefined): ClientsView {
  return value === "archived" || value === "all" ? value : "active";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}) {
  await requireRole([...STAFF_ROLES]);

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const status =
    params.status && isClientStatus(params.status) ? params.status : undefined;
  const view = resolveView(params.view);

  const [clients, summary, profiles] = await Promise.all([
    clientUseCases.list.execute({
      search: search || undefined,
      status,
      archivedOnly: view === "archived",
      includeArchived: view === "all",
    }),
    clientUseCases.portfolioSummary.execute(),
    profileUseCases.list.execute(),
  ]);

  const owners: OwnerOption[] = profiles
    .filter((profile) => (STAFF_ROLES as readonly string[]).includes(profile.role))
    .map((profile) => ({ id: profile.id, label: profile.email }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-muted-foreground text-sm">
          Manage the client workspaces in your SEO OS.
        </p>
      </div>
      <ClientPortfolioCards summary={summary} />
      <ClientsToolbar
        search={search}
        status={status ?? "ALL"}
        view={view}
        owners={owners}
      />
      <ClientsTable clients={clients} owners={owners} />
    </div>
  );
}
