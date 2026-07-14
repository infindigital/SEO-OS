import { requireUser } from "@/lib/auth/session";
import { dashboardUseCases } from "@backend/infrastructure/container";
import { DashboardOverviewView } from "@dashboard/overview/components/dashboard-overview";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const profile = await requireUser();
  const overview = await dashboardUseCases.overview.execute({ days: 30 });

  return <DashboardOverviewView overview={overview} email={profile.email} />;
}
