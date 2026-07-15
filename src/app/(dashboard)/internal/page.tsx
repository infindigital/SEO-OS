import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { dashboardUseCases } from "@backend/infrastructure/container";
import { requireRole } from "@/lib/auth/session";
import { InternalDashboardView } from "@dashboard/internal/components/internal-dashboard";

export const dynamic = "force-dynamic";

export default async function InternalDashboardPage() {
  await requireRole([...STAFF_ROLES]);
  const dashboard = await dashboardUseCases.internal.execute({ days: 30 });

  return <InternalDashboardView dashboard={dashboard} />;
}
