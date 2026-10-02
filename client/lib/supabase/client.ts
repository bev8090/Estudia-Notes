import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Session lives in cookies so the proxy and
// server components can read it too.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
