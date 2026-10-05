import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { DemoView } from "./demo-view";

export const metadata: Metadata = {
  title: "Try it free · Estudia Notes",
  description: "See an exam-focused study guide made from sample notes, or make one from your own notes. No account needed.",
};

export default function DemoPage() {
  return (
    <div className="bg-notebook flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 font-medium text-zinc-700 hover:text-zinc-900">
              Sign in
            </Link>
            <Link
              href="/login?mode=signup&from=demo"
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
            >
              Create free account
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <p className="font-hand text-2xl leading-none text-brand-600">no account needed</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Try Estudia Notes</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          See the study guide it makes from sample lecture notes, or make one from your own notes for free. Create an
          account to save it and take practice exams.
        </p>
        <DemoView />
      </main>

      <SiteFooter />
    </div>
  );
}
