import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">SEO OS</h1>
        <p className="text-lg text-neutral-500">
          The AI-powered SEO Operating System by Infin Digital.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/clients">Open dashboard</Link>
      </Button>
    </main>
  );
}
