"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABEL, LETTERS, percent, shortDate } from "@/lib/format";
import type { AttemptDetail, ReviewQuestion } from "@/lib/types";
import { BackLink, ErrorBox, ProcessingPanel, Spinner, buttonPrimary, buttonSecondary } from "@/components/ui";
import { usePracticeExam } from "@/lib/use-practice-exam";

type Outcome = "correct" | "partial" | "incorrect" | "unanswered";

function outcomeOf(q: ReviewQuestion): Outcome {
  const a = q.answer;
  const answered = q.type === "MCQ" ? a?.selectedIndex != null : Boolean(a?.text);
  if (!answered) return "unanswered";
  if (a?.score === 1) return "correct";
  if (a?.score === 0.5) return "partial";
  return "incorrect";
}

const OUTCOME_STYLE: Record<Outcome, { label: string; className: string }> = {
  correct: { label: "Correct", className: "bg-emerald-50 text-emerald-800" },
  partial: { label: "Partial credit", className: "bg-amber-50 text-amber-800" },
  incorrect: { label: "Incorrect", className: "bg-red-50 text-red-700" },
  unanswered: { label: "Unanswered", className: "bg-zinc-100 text-zinc-600" },
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
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
        Results · {DIFFICULTY_LABEL[exam.difficulty]} exam
      </h1>
      <p className="mt-1 text-xs text-zinc-500">Submitted {shortDate(attempt.submittedAt)}</p>
    </>
  );

  if (attempt.status === "PROCESSING") {
    return (
      <>
        {header}
        <div className="mt-6">
          <ProcessingPanel title="Grading your short answers…" detail="Multiple choice is already scored. This takes a few seconds." />
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

      <section className="mt-6 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div>
          <p className="text-5xl font-semibold tracking-tight text-zinc-900">{percent(attempt.score ?? 0)}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {count("correct")} correct
            {count("partial") > 0 && ` · ${count("partial")} partial`}
            {` · ${count("incorrect")} incorrect`}
            {count("unanswered") > 0 && ` · ${count("unanswered")} unanswered`}
          </p>
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
          <div className="w-full border-t border-zinc-100 pt-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-zinc-800">Topics to review</p>
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
                <li key={topicId} className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
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
    <li className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Question {number}
          {q.topic && ` · ${q.topic.name}`}
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>{style.label}</span>
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
                className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                  isCorrect ? "border-emerald-300 bg-emerald-50" : isPicked ? "border-red-300 bg-red-50" : "border-zinc-200"
                }`}
              >
                <span className="text-zinc-800">
                  <span className="mr-1.5 font-medium text-zinc-500">{LETTERS[i]}.</span>
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
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-2 text-zinc-800">
              {q.answer?.text || <span className="italic text-zinc-400">No answer</span>}
            </p>
          </div>
          {q.answer?.feedback && (
            <div>
              <p className="text-xs font-medium text-zinc-500">Feedback</p>
              <p className="mt-1 text-zinc-800">{q.answer.feedback}</p>
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

      <div className="mt-4 border-t border-zinc-100 pt-3 text-sm">
        <p className="text-xs font-medium text-zinc-500">Explanation</p>
        <p className="mt-1 leading-relaxed text-zinc-700">{q.explanation}</p>
      </div>
    </li>
  );
}
