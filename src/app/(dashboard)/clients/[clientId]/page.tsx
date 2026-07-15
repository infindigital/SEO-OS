import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@backend/domain/auth/user-role";
import { dashboardUseCases } from "@backend/infrastructure/container";
import { buttonVariants } from "@/components/ui/button";
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
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href={`/portal?clientId=${clientId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLink />
          View client portal
        </Link>
      </div>
      <ClientDashboardView dashboard={dashboard} />
    </div>
  );
}
