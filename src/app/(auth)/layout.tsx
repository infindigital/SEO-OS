import Link from "next/link";

import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-lg font-semibold tracking-tight"
      >
        SEO OS
      </Link>
      {children}
      <Toaster />
    </div>
  );
}
