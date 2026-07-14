import { requireRole } from "@/lib/auth/session";
import { profileUseCases } from "@backend/infrastructure/container";
import { AdminUsersTable } from "@dashboard/admin/components/admin-users-table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requireRole(["ADMIN"]);
  const users = await profileUseCases.list.execute();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">
          Manage users and their access roles.
        </p>
      </div>
      <AdminUsersTable users={users} currentUserId={me.id} />
    </div>
  );
}
