import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

// Shared layout for the Privacy Policy and Terms of Service pages.
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="bg-notebook flex flex-1 flex-col">
      <header className="border-b border-brand-100/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-brand-700">
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 sm:px-6">
        <article className="mx-auto max-w-3xl rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Last updated: {LEGAL_LAST_UPDATED}</p>
          <p className="mt-6 leading-relaxed text-zinc-700">{intro}</p>
          <div className="legal-prose mt-8 space-y-8">{children}</div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-zinc-700 [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
