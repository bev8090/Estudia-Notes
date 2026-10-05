import { BookOpen, Check, Target, TriangleAlert } from "lucide-react";
import type { Topic } from "@/lib/types";

// The note's summary, laid out as an exam study guide: what's most likely to be tested
// first, then each topic with explanations, key terms, what to be able to do, and
// common mistakes. Notes summarized before these fields existed simply skip them.
export function StudyGuide({
  overview,
  examPriorities,
  topics,
}: {
  overview: string;
  examPriorities: string[];
  topics: Topic[];
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-600 uppercase">
          <BookOpen className="h-4 w-4" aria-hidden="true" /> Study guide
        </h2>
        <p className="mt-2 leading-relaxed text-zinc-800">{overview}</p>

        {examPriorities.length > 0 && (
          <div className="relative mt-5 overflow-hidden rounded-xl border-2 border-yellow-300 bg-yellow-50/70 p-4">
            <h3 className="flex items-center gap-2 font-display font-bold text-zinc-900">
              <Target className="h-4.5 w-4.5 text-yellow-700" aria-hidden="true" />
              Most likely to be tested
            </h3>
            <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-zinc-800">
              {examPriorities.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[11px] font-bold text-yellow-950">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {topics.map((topic, i) => (
        <section key={topic.id} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-display text-sm font-bold text-brand-700">
              {i + 1}
            </span>
            <h3 className="font-display text-lg font-bold text-zinc-900">{topic.name}</h3>
            <ImportanceBadge importance={topic.importance} />
          </div>

          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-700">
            {topic.keyPoints.map((point, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {topic.keyTerms.length > 0 && (
            <dl className="mt-4 space-y-1.5 rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 text-sm">
              {topic.keyTerms.map((k) => (
                <div key={k.term}>
                  <dt className="inline font-semibold text-brand-900">{k.term}: </dt>
                  <dd className="inline text-zinc-700">{k.definition}</dd>
                </div>
              ))}
            </dl>
          )}

          {topic.examTips.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">Know for the exam</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-800">
                {topic.examTips.map((tip, j) => (
                  <li key={j} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {topic.pitfalls.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-amber-900 uppercase">
                <TriangleAlert className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> Watch out
              </h4>
              <ul className="mt-1.5 space-y-1 text-sm text-amber-950">
                {topic.pitfalls.map((pitfall, j) => (
                  <li key={j}>{pitfall}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

// Only HIGH and LOW are labeled; MEDIUM is the unremarkable middle and stays quiet.
function ImportanceBadge({ importance }: { importance: Topic["importance"] }) {
  if (importance === "HIGH") {
    return (
      <span className="bg-ai-gradient rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">High priority</span>
    );
  }
  if (importance === "LOW") {
    return <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Lower priority</span>;
  }
  return null;
}
