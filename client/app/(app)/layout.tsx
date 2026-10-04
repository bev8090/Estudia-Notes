import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/providers";
import { SignOutButton } from "@/components/sign-out-button";
import { AppNav, NewNotesButton } from "@/components/app-nav";
import { Logo } from "@/components/brand";

// Shared shell for every signed-in page (dashboard, notes, exams, attempts, progress).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // proxy.ts already guards these routes; this is a second check in case the matcher changes.
  if (!data?.claims) redirect("/login");

  const email = data.claims.email ?? "";
  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <Providers>
      <div className="bg-notebook flex flex-1 flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-4">
              <Logo compact />
              <span className="hidden h-6 w-px bg-zinc-200 md:block" aria-hidden="true" />
              <AppNav />
            </div>
            <div className="flex items-center gap-2">
              <NewNotesButton />
              <span
                title={email}
                className="bg-ai-gradient hidden h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold text-white md:inline-flex"
              >
                <span className="sr-only">Signed in as </span>
                {initial}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
          {children}
        </main>
      </div>
    </Providers>
  );
}
