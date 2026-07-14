import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for use in the browser (Client Components).
 * Reads the public URL and anon key from the environment at call time.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
