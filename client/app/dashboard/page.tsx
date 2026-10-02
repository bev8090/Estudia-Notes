import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { ApiStatus } from "./api-status";

export const metadata: Metadata = {
  title: "Dashboard · Estudia Notes",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // proxy.ts already guards this route; this is a second check in case the matcher changes.
  if (!data?.claims) redirect("/login?next=/dashboard");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="font-semibold text-zinc-900">Estudia Notes</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">{data.claims.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Your notes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Uploading notes and generating exams arrive in the next phase.
        </p>
        <ApiStatus />
      </main>
    </div>
  );
}
