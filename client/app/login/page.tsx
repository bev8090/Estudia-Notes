import type { Metadata } from "next";
import { safeNextPath } from "@/lib/safe-redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Estudia Notes",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-900">
          Estudia Notes
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Summaries and practice exams from your notes
        </p>
        <LoginForm
          next={safeNextPath(typeof next === "string" ? next : undefined)}
          initialError={typeof error === "string" ? error : undefined}
        />
      </div>
    </main>
  );
}
