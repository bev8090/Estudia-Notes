"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LETTERS, percent, shortDate } from "@/lib/format";
import type { ExamDetail, PublicQuestion } from "@/lib/types";
import { BackLink, ErrorBox, ProcessingPanel, Spinner, buttonPrimary, buttonSecondary, inputClass } from "@/components/ui";
import { DifficultyBadge } from "@/components/difficulty";

type Answer = { selectedIndex?: number; text?: string };
type Answers = Record<string, Answer>;

// Drafts live in localStorage so a refresh mid-exam doesn't lose answers.
const draftKey = (examId: string) => `exam-draft:${examId}`;
function loadDraft(examId: string): Answers {
  try {
    return JSON.parse(localStorage.getItem(draftKey(examId)) ?? "{}");
  } catch {
    return {};
  }
}
function saveDraft(examId: string, answers: Answers | null) {
  try {
    if (answers) localStorage.setItem(draftKey(examId), JSON.stringify(answers));
    else localStorage.removeItem(draftKey(examId));
  } catch {
    // Storage can be unavailable (private mode); drafts are just a convenience.
  }
}

const isAnswered = (q: PublicQuestion, a: Answer | undefined) =>
  q.type === "MCQ" ? a?.selectedIndex != null : Boolean(a?.text?.trim());

export function ExamView({ id }: { id: string }) {
  const router = useRouter();
  // Questions only render after the exam is fetched in the browser, so reading
  // localStorage here can't cause a server/client mismatch.
  const [answers, setAnswers] = useState<Answers>(() => loadDraft(id));
  const [confirming, setConfirming] = useState(false);

  const { data: exam, error, isPending } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => apiFetch<ExamDetail>(`/api/exams/${id}`),
    refetchInterval: (query) => (query.state.data?.status === "PROCESSING" ? 2500 : false),
  });


  const submit = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(`/api/exams/${id}/attempts`, {
        method: "POST",
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, a]) => ({ questionId, ...a })),
        }),
      }),
    onSuccess: ({ id: attemptId }) => {
      saveDraft(id, null);
      router.push(`/attempts/${attemptId}`);
    },
  });

  function update(questionId: string, answer: Answer) {
    setAnswers((cur) => {
      const next = { ...cur, [questionId]: answer };
      saveDraft(id, next);
      return next;
    });
  }

  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <Spinner /> Loading…
      </p>
    );
  }
  if (error) return <ErrorBox>{error.message}</ErrorBox>;

  const answeredCount = exam.questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const unanswered = exam.questions.length - answeredCount;

  return (
    <>
      <BackLink href={`/notes/${exam.note.id}`}>{exam.note.title}</BackLink>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900">Practice exam</h1>
        <DifficultyBadge difficulty={exam.difficulty} />
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
          {exam.questionCount} questions
        </span>
      </div>

      {exam.attempts.length > 0 && (
        <p className="mt-2 text-sm text-zinc-500">
          Previous attempts:{" "}
          {exam.attempts.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ", "}
              <Link href={`/attempts/${a.id}`} className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500">
                {a.score != null ? percent(a.score) : "grading"} on {shortDate(a.submittedAt)}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="mt-6">
        {exam.status === "PROCESSING" && (
          <ProcessingPanel
            title="Writing your exam…"
            detail="AI is writing questions from your study guide, weighted toward what's most likely to be tested. Usually under a minute."
          />
        )}
        {exam.status === "FAILED" && (
          <ErrorBox>{exam.error ?? "Generating this exam failed."} Go back and try generating another.</ErrorBox>
        )}
        {exam.status === "READY" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (unanswered > 0 && !confirming) setConfirming(true);
              else submit.mutate();
            }}
            className="space-y-4"
          >
            {exam.questions.map((q, i) => (
              <QuestionCard key={q.id} number={i + 1} question={q} answer={answers[q.id]} onChange={(a) => update(q.id, a)} />
            ))}

            <div className="sticky bottom-0 -mx-4 border-t border-brand-100 bg-white/90 px-4 py-4 backdrop-blur">
              {submit.error && <div className="mb-3"><ErrorBox>{submit.error.message}</ErrorBox></div>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium text-zinc-700">
                    {answeredCount} of {exam.questions.length} answered
                  </p>
                  <div
                    className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-brand-100"
                    role="progressbar"
                    aria-label="Questions answered"
                    aria-valuemin={0}
                    aria-valuemax={exam.questions.length}
                    aria-valuenow={answeredCount}
                  >
                    <div
                      className="bg-ai-gradient h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${(answeredCount / Math.max(exam.questions.length, 1)) * 100}%` }}
                    />
                  </div>
                </div>
                {confirming && unanswered > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-zinc-700">
                      {unanswered} unanswered question{unanswered === 1 ? "" : "s"} will score 0.
                    </span>
                    <button type="button" onClick={() => setConfirming(false)} className={buttonSecondary}>
                      Keep working
                    </button>
                    <button type="submit" disabled={submit.isPending} className={buttonPrimary}>
                      {submit.isPending ? <><Spinner /> Submitting…</> : "Submit anyway"}
                    </button>
                  </div>
                ) : (
                  <button type="submit" disabled={submit.isPending} className={buttonPrimary}>
                    {submit.isPending ? <><Spinner /> Submitting…</> : "Submit answers"}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function QuestionCard({
  number,
  question,
  answer,
  onChange,
}: {
  number: number;
  question: PublicQuestion;
  answer: Answer | undefined;
  onChange: (answer: Answer) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <legend className="sr-only">Question {number}</legend>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-brand-600 px-2 font-display text-sm font-bold text-white">
          {number}
        </span>
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          {question.type === "MCQ" ? "Multiple choice" : "Short answer"}
        </span>
      </div>
      <p className="mt-3 font-medium leading-relaxed text-zinc-900">{question.prompt}</p>

      {question.type === "MCQ" ? (
        <div className="mt-3 space-y-2">
          {question.choices.map((choice, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                answer?.selectedIndex === i
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-zinc-200 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={answer?.selectedIndex === i}
                onChange={() => onChange({ selectedIndex: i })}
                className="sr-only"
              />
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  answer?.selectedIndex === i ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className="text-zinc-800">{choice}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          value={answer?.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
          maxLength={3000}
          placeholder="Answer in 1–3 sentences"
          className={`${inputClass} mt-3 leading-relaxed`}
        />
      )}
    </fieldset>
  );
}
