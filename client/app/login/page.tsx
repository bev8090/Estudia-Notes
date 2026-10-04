import type { Metadata } from "next";
import { ChartLine, Highlighter, PenLine, Target } from "lucide-react";
import { safeNextPath } from "@/lib/safe-redirect";
import { Logo, LogoMark, ScribbleArrow } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Estudia Notes",
};

const PERKS = [
  { icon: Highlighter, text: "Study guides that highlight what's most likely on the exam" },
  { icon: Target, text: "Practice exams at Standard, Hard or Challenge difficulty" },
  { icon: PenLine, text: "Written answers graded with specific feedback" },
  { icon: ChartLine, text: "Progress tracking that finds your weak topics" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* Brand panel (large screens) */}
      <section className="bg-ai-gradient relative hidden overflow-hidden px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-28 -left-16 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" aria-hidden="true" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.35) 1px, transparent 0)", backgroundSize: "22px 22px" }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark className="h-9 w-9 ring-2 ring-white/50" />
          <span className="font-display text-xl font-bold">Estudia Notes</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl leading-tight font-extrabold tracking-tight">
            Turn your notes into your best exam score.
          </h2>
          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-brand-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-yellow-200">
          <span className="font-hand text-3xl -rotate-2">you&apos;ve got this!</span>
          <ScribbleArrow className="h-8 w-14" />
        </div>
      </section>

      {/* Form */}
      <section className="bg-notebook flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-zinc-900 lg:mt-0">Welcome</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in or create an account to start studying.</p>
          <LoginForm
            next={safeNextPath(typeof next === "string" ? next : undefined)}
            initialError={typeof error === "string" ? error : undefined}
          />
        </div>
      </section>
    </main>
  );
}
