import Link from "next/link";

import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Link href="/clients" className="text-sm font-semibold tracking-tight">
            SEO OS
          </Link>
          <nav className="text-muted-foreground flex items-center gap-6 text-sm">
            <Link href="/clients" className="hover:text-foreground transition-colors">
              Clients
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <Toaster />
    </div>
  );
}
