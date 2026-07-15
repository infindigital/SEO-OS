import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { dashboardUseCases } from "@backend/infrastructure/container";
import { ClientDashboardView } from "@dashboard/client/components/client-dashboard";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireRole([...STAFF_ROLES]);
  const { clientId } = await params;
  const dashboard = await dashboardUseCases.client.execute(clientId);
  if (!dashboard) {
    notFound();
  }
  return <ClientDashboardView dashboard={dashboard} />;
}
