import { Check, Sparkles, Target } from "lucide-react";
import { ScribbleArrow } from "@/components/brand";

// An illustrative preview of the product (study guide, exam question, progress),
// built from HTML so it stays crisp. Purely decorative for screen readers; the
// surrounding copy describes the same features in words.
export function HeroCollage() {
  return (
    <div className="relative mx-auto w-full max-w-md pt-12 lg:max-w-none" aria-hidden="true">
      {/* soft color blobs behind the cards */}
      <div className="absolute -top-8 -right-6 h-56 w-56 rounded-full bg-fuchsia-300/40 blur-3xl" />
      <div className="absolute -bottom-10 -left-8 h-60 w-60 rounded-full bg-brand-300/50 blur-3xl" />

      {/* Study guide card */}
      <div className="relative rounded-2xl border border-brand-100 bg-white p-5 shadow-xl shadow-brand-900/10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Study guide</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            <Sparkles className="h-3 w-3" /> AI
          </span>
        </div>
        <p className="mt-1 font-display text-lg font-bold text-zinc-900">Cellular Respiration</p>
        <div className="mt-3 rounded-xl bg-brand-50/70 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-800">
            <Target className="h-3.5 w-3.5" /> Most likely to be tested
          </p>
          <ol className="mt-2 space-y-1.5 text-[13px] leading-snug text-zinc-700">
            <li>
              1. <span className="highlight">O₂ is the final electron acceptor</span>; without it the ETC stops.
            </li>
            <li>2. Where each stage happens: cytoplasm, matrix, inner membrane.</li>
            <li>3. Fermentation regenerates NAD⁺ but yields only 2 ATP.</li>
          </ol>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-white">High priority</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">2 common mistakes</span>
        </div>
      </div>

      {/* Handwritten annotation, above the card and pointing down at the highlighted item */}
      <div className="absolute top-0 left-6 flex items-end gap-1 text-brand-700">
        <span className="font-hand text-2xl leading-none -rotate-3">this will be on the exam!</span>
        <ScribbleArrow className="h-9 w-16 translate-y-5 rotate-70" />
      </div>

      {/* Exam question card */}
      <div
        className="animate-float relative z-10 -mt-2 ml-auto w-[88%] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-brand-900/10 sm:w-[78%]"
        style={{ ["--tilt" as string]: "2deg", transform: "rotate(2deg)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Question 3 · Hard</p>
        <p className="mt-1 text-sm font-medium text-zinc-900">Where does the Krebs cycle take place?</p>
        <ul className="mt-2.5 space-y-1.5 text-[13px]">
          <li className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-600">Inner mitochondrial membrane</li>
          <li className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-emerald-900">
            Mitochondrial matrix <Check className="h-4 w-4 text-emerald-600" />
          </li>
          <li className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-600">Cytoplasm</li>
        </ul>
      </div>

      {/* Progress card */}
      <div
        className="relative -mt-5 w-[62%] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-brand-900/10 sm:w-[52%]"
        style={{ transform: "rotate(-2deg)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Exam scores</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="font-display text-3xl font-bold text-zinc-900">92%</p>
          <svg viewBox="0 0 100 36" className="h-9 w-24">
            <path d="M2 32 L20 26 L36 28 L52 18 L68 20 L84 9 L98 4" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="98" cy="4" r="3.5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">Up from 40% on your first try</p>
      </div>
    </div>
  );
}
