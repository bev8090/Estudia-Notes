import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/providers";
import { SignOutButton } from "@/components/sign-out-button";

// Shared shell for every signed-in page (dashboard, notes, exams, attempts).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // proxy.ts already guards these routes; this is a second check in case the matcher changes.
  if (!data?.claims) redirect("/login");

  return (
    <Providers>
      <div className="flex flex-1 flex-col bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/dashboard" className="font-semibold text-zinc-900">
                Estudia Notes
              </Link>
              <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
                Notes
              </Link>
              <Link href="/progress" className="text-zinc-600 hover:text-zinc-900">
                Progress
              </Link>
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-zinc-500 sm:inline">{data.claims.email}</span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </div>
    </Providers>
  );
}
