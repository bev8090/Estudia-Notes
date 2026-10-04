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
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Overview</h2>
        <p className="mt-2 leading-relaxed text-zinc-800">{overview}</p>

        {examPriorities.length > 0 && (
          <div className="mt-5 rounded-lg border border-zinc-900/10 bg-zinc-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
              <TargetIcon /> Most likely to be tested
            </h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-800 marker:font-medium marker:text-zinc-500">
              {examPriorities.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {topics.map((topic, i) => (
        <section key={topic.id} className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="font-semibold text-zinc-900">
              <span className="mr-2 text-zinc-400">{i + 1}.</span>
              {topic.name}
            </h3>
            <ImportanceBadge importance={topic.importance} />
          </div>

          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-700">
            {topic.keyPoints.map((point, j) => (
              <li key={j}>{point}</li>
            ))}
          </ul>

          {topic.keyTerms.length > 0 && (
            <dl className="mt-4 space-y-1.5 rounded-lg bg-zinc-50 p-3 text-sm">
              {topic.keyTerms.map((k) => (
                <div key={k.term}>
                  <dt className="inline font-medium text-zinc-900">{k.term}: </dt>
                  <dd className="inline text-zinc-700">{k.definition}</dd>
                </div>
              ))}
            </dl>
          )}

          {topic.examTips.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Know for the exam</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-800">
                {topic.examTips.map((tip, j) => (
                  <li key={j} className="flex gap-2">
                    <CheckIcon />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {topic.pitfalls.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                <WarningIcon /> Watch out
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
      <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">High priority</span>
    );
  }
  if (importance === "LOW") {
    return <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Lower priority</span>;
  }
  return null;
}

function TargetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.25" />
      <circle cx="8" cy="8" r="3.25" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <path d="M8 1.5 15 14H1L8 1.5Z" fill="#fab219" />
      <path d="M8 6v3.5M8 11.6v.1" stroke="#18181b" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
