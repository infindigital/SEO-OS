import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { dashboardUseCases } from "@backend/infrastructure/container";
import { isStaffRole } from "@backend/domain/auth/user-role";
import { DashboardOverviewView } from "@dashboard/overview/components/dashboard-overview";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const profile = await requireUser();

  // Clients get the curated portal, never the internal metrics overview.
  if (!isStaffRole(profile.role)) {
    redirect("/portal");
  }

  const overview = await dashboardUseCases.overview.execute({ days: 30 });
  return <DashboardOverviewView overview={overview} email={profile.email} />;
}
