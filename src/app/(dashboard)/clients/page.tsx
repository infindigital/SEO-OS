import { isClientStatus } from "@backend/domain/client/client-status";
import { clientUseCases } from "@backend/infrastructure/container";
import { ClientsTable } from "@dashboard/clients/components/clients-table";
import { ClientsToolbar } from "@dashboard/clients/components/clients-toolbar";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const status =
    params.status && isClientStatus(params.status) ? params.status : undefined;

  const clients = await clientUseCases.list.execute({
    search: search || undefined,
    status,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-muted-foreground text-sm">
          Manage the client workspaces in your SEO OS.
        </p>
      </div>
      <ClientsToolbar search={search} status={status ?? "ALL"} />
      <ClientsTable clients={clients} />
    </div>
  );
}
