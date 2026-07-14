import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { isStaffRole } from "@backend/domain/auth/user-role";
import { RoleBadge } from "@dashboard/components/role-badge";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const profile = await requireUser();
  const staff = isStaffRole(profile.role);
  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Signed in as {profile.email}
          </p>
        </div>
        <RoleBadge role={profile.role} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff && (
          <Link href="/clients" className="block">
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>
                  Manage the client workspaces in your SEO OS.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {isAdmin && (
          <Link href="/admin" className="block">
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardHeader>
                <CardTitle>Admin</CardTitle>
                <CardDescription>
                  Manage users and their access roles.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {!staff && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Your account is active. Your team will share workspaces and
                reports with you here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
