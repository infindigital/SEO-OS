import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-muted-foreground text-sm font-medium">403</p>
      <h1 className="text-3xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-muted-foreground max-w-md">
        You don&apos;t have permission to view this page. If you think this is a
        mistake, contact your administrator.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
