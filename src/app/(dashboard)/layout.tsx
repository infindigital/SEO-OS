import Link from "next/link";

import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/auth/session";
import { MainNav } from "@dashboard/components/main-nav";
import { UserMenu } from "@dashboard/components/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-semibold tracking-tight"
            >
              SEO OS
            </Link>
            <MainNav role={profile.role} />
          </div>
          <UserMenu profile={profile} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <Toaster />
    </div>
  );
}
