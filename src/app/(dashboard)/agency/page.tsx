import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { dashboardUseCases } from "@backend/infrastructure/container";
import { AgencyOverviewView } from "@dashboard/agency/components/agency-overview";

export const dynamic = "force-dynamic";

export default async function AgencyPage() {
  await requireRole([...STAFF_ROLES]);
  const overview = await dashboardUseCases.agency.execute();
  return <AgencyOverviewView overview={overview} />;
}
