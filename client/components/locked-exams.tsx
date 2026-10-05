import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { DIFFICULTY_LABEL } from "@/lib/format";
import { DIFFICULTY_STYLE } from "@/components/difficulty";

// The practice-exam panel as visitors without an account see it: the options are
// visible (so they know what they'd get) but locked behind a free sign-up.
export function LockedExams({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="bg-ai-gradient inline-flex h-9 w-9 items-center justify-center rounded-xl text-white">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display font-bold text-zinc-900">Practice exam</h2>
          <p className="text-xs text-zinc-500">Built from this study guide</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2" aria-label="Exam difficulties (requires an account)">
        {(["STANDARD", "HARD", "CHALLENGE"] as const).map((d) => {
          const { icon: Icon, blurb, iconBox } = DIFFICULTY_STYLE[d];
          return (
            <li key={d} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm opacity-60">
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBox}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="font-semibold text-zinc-900">{DIFFICULTY_LABEL[d]}</span>
                <span className="block text-xs text-zinc-500">{blurb}</span>
              </span>
              <Lock className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            </li>
          );
        })}
      </ul>

      <div className="mt-5 rounded-xl bg-brand-50 p-4 text-center">
        <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-900">
          <Lock className="h-4 w-4" aria-hidden="true" /> Practice exams need a free account
        </p>
        <p className="mt-1 text-xs leading-relaxed text-brand-900/80">{message}</p>
        <Link
          href="/login?mode=signup&from=demo"
          className="bg-ai-gradient mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-transform hover:-translate-y-px"
        >
          Create a free account
        </Link>
        <p className="mt-2 text-xs text-zinc-500">
          Already have one?{" "}
          <Link href="/login?from=demo" className="font-medium text-brand-700 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
