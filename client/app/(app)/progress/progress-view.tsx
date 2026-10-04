"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABEL, percent, shortDate } from "@/lib/format";
import type { Difficulty, ProgressStats, TopicProgress } from "@/lib/types";
import { usePracticeExam } from "@/lib/use-practice-exam";
import { ErrorBox, Spinner, buttonPrimary } from "@/components/ui";
import { ScoreChart } from "./score-chart";

export function ProgressView() {
  const { data, error, isPending } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<ProgressStats>("/api/stats"),
  });

  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <Spinner /> Loading your progress…
      </p>
    );
  }
  if (error) return <ErrorBox>{error.message}</ErrorBox>;

  const { totals, history, notes } = data;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Progress</h1>
      <p className="mt-1 text-sm text-zinc-500">How your scores are trending and which topics need more practice.</p>

      {totals.attempts === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <p className="font-medium text-zinc-900">No exams taken yet</p>
          <p className="mt-1 text-sm text-zinc-500">Take a practice exam and your scores and topic accuracy will show up here.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline">
            Go to your notes
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Average score" value={totals.averageScore != null ? percent(totals.averageScore) : "–"} />
            <StatTile label="Exams taken" value={totals.attempts.toLocaleString()} />
            <StatTile label="Questions answered" value={totals.questionsAnswered.toLocaleString()} />
            <StatTile label="Topics to practice" value={`${totals.weakTopics} of ${totals.topicsPracticed}`} />
          </dl>

          <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">Exam scores</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Your last {history.length} graded attempt{history.length === 1 ? "" : "s"}, oldest to newest
            </p>
            <div className="mt-4">
              <ScoreChart points={history} />
            </div>
          </section>

          <section className="mt-6">
            <h2 className="font-semibold text-zinc-900">Accuracy by topic</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Based on your latest answers per topic. Topics under 70% are marked for practice.
            </p>
            <div className="mt-4 space-y-4">
              {notes.map((note) => (
                <NoteTopics key={note.noteId} noteId={note.noteId} noteTitle={note.noteTitle} topics={note.topics} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

function NoteTopics({ noteId, noteTitle, topics }: { noteId: string; noteTitle: string; topics: TopicProgress[] }) {
  const practice = usePracticeExam();
  const [difficulty, setDifficulty] = useState<Difficulty>("STANDARD");
  const weak = topics.filter((t) => t.weak);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/notes/${noteId}`} className="font-medium text-zinc-900 hover:underline">
          {noteTitle}
        </Link>
        {weak.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`difficulty-${noteId}`}>
              Difficulty
            </label>
            <select
              id={`difficulty-${noteId}`}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-800"
            >
              {(["STANDARD", "HARD", "CHALLENGE"] as const).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => practice.mutate({ noteId, topicIds: weak.map((t) => t.topicId), difficulty })}
              disabled={practice.isPending}
              className={`${buttonPrimary} py-2!`}
            >
              {practice.isPending ? <><Spinner /> Starting…</> : `Practice ${weak.length} weak topic${weak.length === 1 ? "" : "s"}`}
            </button>
          </div>
        )}
      </div>
      {practice.error && <div className="mt-3"><ErrorBox>{practice.error.message}</ErrorBox></div>}

      <ul className="mt-4 space-y-3">
        {topics.map((t) => (
          <TopicBar key={t.topicId} topic={t} />
        ))}
      </ul>
    </div>
  );
}

// One horizontal bar per topic: a single hue (the bars all measure the same thing),
// value at the tip, and "Needs practice" as an icon + text so it never relies on color.
function TopicBar({ topic }: { topic: TopicProgress }) {
  return (
    <li title={`${topic.name}: ${percent(topic.accuracy)} · last practiced ${shortDate(topic.lastPracticed)}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="text-zinc-800">
          {topic.name}
          {topic.weak && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-700">
              <WarningIcon /> Needs practice
            </span>
          )}
        </span>
        <span className="text-xs text-zinc-500">
          {topic.answered} question{topic.answered === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-2.5 flex-1 rounded-r bg-zinc-100">
          <div
            className="h-full rounded-r"
            style={{ width: `${Math.max(topic.accuracy * 100, 1)}%`, backgroundColor: "#2a78d6" }}
          />
        </div>
        <span className="w-10 text-right text-sm font-medium text-zinc-900" style={{ fontVariantNumeric: "tabular-nums" }}>
          {percent(topic.accuracy)}
        </span>
      </div>
    </li>
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
