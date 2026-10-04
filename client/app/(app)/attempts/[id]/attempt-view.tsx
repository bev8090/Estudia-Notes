"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LETTERS, percent, shortDate } from "@/lib/format";
import type { AttemptDetail, ReviewQuestion } from "@/lib/types";
import { BackLink, ErrorBox, ProcessingPanel, Spinner, buttonPrimary, buttonSecondary } from "@/components/ui";
import { usePracticeExam } from "@/lib/use-practice-exam";
import { DifficultyBadge } from "@/components/difficulty";
import { CircleCheck, CircleDot, CircleMinus, CircleX, Lightbulb, Sparkles, Target, type LucideIcon } from "lucide-react";

type Outcome = "correct" | "partial" | "incorrect" | "unanswered";

function outcomeOf(q: ReviewQuestion): Outcome {
  const a = q.answer;
  const answered = q.type === "MCQ" ? a?.selectedIndex != null : Boolean(a?.text);
  if (!answered) return "unanswered";
  if (a?.score === 1) return "correct";
  if (a?.score === 0.5) return "partial";
  return "incorrect";
}

// Each outcome has its own icon + label, so the result never relies on color alone.
const OUTCOME_STYLE: Record<Outcome, { label: string; className: string; icon: LucideIcon; border: string }> = {
  correct: { label: "Correct", className: "bg-emerald-50 text-emerald-800", icon: CircleCheck, border: "border-l-emerald-500" },
  partial: { label: "Partial credit", className: "bg-amber-50 text-amber-900", icon: CircleDot, border: "border-l-amber-400" },
  incorrect: { label: "Incorrect", className: "bg-red-50 text-red-700", icon: CircleX, border: "border-l-red-500" },
  unanswered: { label: "Unanswered", className: "bg-zinc-100 text-zinc-600", icon: CircleMinus, border: "border-l-zinc-300" },
};

export function AttemptView({ id }: { id: string }) {
  const { data: attempt, error, isPending } = useQuery({
    queryKey: ["attempt", id],
    queryFn: () => apiFetch<AttemptDetail>(`/api/attempts/${id}`),
    refetchInterval: (query) => (query.state.data?.status === "PROCESSING" ? 2000 : false),
  });
  const practice = usePracticeExam();

  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <Spinner /> Loading…
      </p>
    );
  }
  if (error) return <ErrorBox>{error.message}</ErrorBox>;

  const { exam } = attempt;
  const header = (
    <>
      <BackLink href={`/notes/${exam.note.id}`}>{exam.note.title}</BackLink>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900">Results</h1>
        <DifficultyBadge difficulty={exam.difficulty} />
      </div>
      <p className="mt-1 text-sm text-zinc-500">Submitted {shortDate(attempt.submittedAt)}</p>
    </>
  );

  if (attempt.status === "PROCESSING") {
    return (
      <>
        {header}
        <div className="mt-6">
          <ProcessingPanel title="Grading your written answers…" detail="Multiple choice is already scored. AI is checking your short answers against the rubric, which takes a few seconds." />
        </div>
      </>
    );
  }
  if (attempt.status === "FAILED") {
    return (
      <>
        {header}
        <div className="mt-6">
          <ErrorBox>{attempt.error ?? "Grading failed."} You can retake the exam to try again.</ErrorBox>
        </div>
      </>
    );
  }

  const outcomes = attempt.questions.map(outcomeOf);
  const count = (o: Outcome) => outcomes.filter((x) => x === o).length;
  // Topics with any missed or partly-right question, most-missed first.
  const missedByTopic = new Map<string, { name: string; missed: number }>();
  attempt.questions.forEach((q, i) => {
    if (outcomes[i] === "correct" || !q.topic) return;
    const entry = missedByTopic.get(q.topic.id) ?? { name: q.topic.name, missed: 0 };
    entry.missed += 1;
    missedByTopic.set(q.topic.id, entry);
  });
  const weakTopics = [...missedByTopic.entries()].sort((a, b) => b[1].missed - a[1].missed);

  return (
    <>
      {header}

      <section className="mt-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-5">
          <ScoreRing score={attempt.score ?? 0} />
          <div>
            <p className="font-hand text-3xl leading-none text-brand-600">{scoreMessage(attempt.score ?? 0)}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {count("correct")} correct
            {count("partial") > 0 && ` · ${count("partial")} partial`}
            {` · ${count("incorrect")} incorrect`}
            {count("unanswered") > 0 && ` · ${count("unanswered")} unanswered`}
          </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/exams/${exam.id}`} className={buttonSecondary}>
            Retake exam
          </Link>
          <Link href={`/notes/${exam.note.id}`} className={buttonPrimary}>
            New exam
          </Link>
        </div>
        {weakTopics.length > 0 && (
          <div className="w-full rounded-xl bg-brand-50/60 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 font-display font-bold text-brand-900">
                <Target className="h-4 w-4" aria-hidden="true" /> Topics to review
              </p>
              <button
                type="button"
                onClick={() =>
                  practice.mutate({
                    noteId: exam.note.id,
                    topicIds: weakTopics.map(([topicId]) => topicId),
                    difficulty: exam.difficulty,
                  })
                }
                disabled={practice.isPending}
                className={`${buttonSecondary} py-1.5!`}
              >
                {practice.isPending ? <><Spinner /> Starting…</> : "Practice missed topics"}
              </button>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {weakTopics.map(([topicId, { name, missed }]) => (
                <li key={topicId} className="rounded-full border border-brand-100 bg-white px-3 py-1 text-zinc-700">
                  {name} <span className="text-zinc-400">({missed} missed)</span>
                </li>
              ))}
            </ul>
            {practice.error && <div className="mt-3"><ErrorBox>{practice.error.message}</ErrorBox></div>}
          </div>
        )}
      </section>

      <ol className="mt-6 space-y-4">
        {attempt.questions.map((q, i) => (
          <ReviewCard key={q.id} number={i + 1} question={q} outcome={outcomes[i]} />
        ))}
      </ol>
    </>
  );
}

function ReviewCard({ number, question: q, outcome }: { number: number; question: ReviewQuestion; outcome: Outcome }) {
  const style = OUTCOME_STYLE[outcome];
  return (
    <li className={`rounded-2xl border border-l-4 border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 ${style.border}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Question {number}
          {q.topic && ` · ${q.topic.name}`}
        </p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>
          <style.icon className="h-3.5 w-3.5" aria-hidden="true" />
          {style.label}
        </span>
      </div>
      <p className="mt-1.5 font-medium leading-relaxed text-zinc-900">{q.prompt}</p>

      {q.type === "MCQ" ? (
        <ul className="mt-3 space-y-2 text-sm">
          {q.choices.map((choice, i) => {
            const isCorrect = i === q.correctIndex;
            const isPicked = i === q.answer?.selectedIndex;
            return (
              <li
                key={i}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                  isCorrect ? "border-emerald-300 bg-emerald-50" : isPicked ? "border-red-300 bg-red-50" : "border-zinc-200"
                }`}
              >
                <span className="flex items-center gap-3 text-zinc-800">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/80 text-xs font-bold text-zinc-600 ring-1 ring-zinc-200">
                    {LETTERS[i]}
                  </span>
                  {choice}
                </span>
                <span className="shrink-0 text-xs font-medium">
                  {isCorrect && <span className="text-emerald-700">Correct answer</span>}
                  {isPicked && !isCorrect && <span className="text-red-700">Your answer</span>}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500">Your answer</p>
            <p className="mt-1 whitespace-pre-wrap rounded-xl bg-zinc-50 px-3.5 py-2.5 text-zinc-800">
              {q.answer?.text || <span className="italic text-zinc-400">No answer</span>}
            </p>
          </div>
          {q.answer?.feedback && (
            <div>
              <p className="flex items-center gap-1 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI feedback
              </p>
              <p className="mt-1 rounded-xl border border-violet-100 bg-violet-50/60 px-3.5 py-2.5 text-violet-950">{q.answer.feedback}</p>
            </div>
          )}
          {q.modelAnswer && (
            <div>
              <p className="text-xs font-medium text-zinc-500">Model answer</p>
              <p className="mt-1 text-zinc-800">{q.modelAnswer}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 text-sm">
        <p className="flex items-center gap-1 text-xs font-semibold text-zinc-600">
          <Lightbulb className="h-3.5 w-3.5 text-yellow-600" aria-hidden="true" /> Explanation
        </p>
        <p className="mt-1 leading-relaxed text-zinc-700">{q.explanation}</p>
      </div>
    </li>
  );
}

function scoreMessage(score: number) {
  if (score >= 0.9) return "outstanding!";
  if (score >= 0.75) return "nice work!";
  if (score >= 0.5) return "getting there!";
  return "keep practicing!";
}

// Circular score gauge; the color shifts with the score, and the number is always shown.
function ScoreRing({ score }: { score: number }) {
  const color = score >= 0.75 ? "#059669" : score >= 0.5 ? "#d97706" : "#dc2626";
  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${score * 360}deg, #eef2ff 0deg)` }}
    >
      <div className="flex h-23 w-23 items-center justify-center rounded-full bg-white">
        <span className="font-display text-3xl font-extrabold tracking-tight text-zinc-900">{percent(score)}</span>
      </div>
    </div>
  );
}
