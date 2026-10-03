"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABEL, LETTERS, percent, shortDate } from "@/lib/format";
import type { ExamDetail, PublicQuestion } from "@/lib/types";
import { BackLink, ErrorBox, ProcessingPanel, Spinner, buttonPrimary, buttonSecondary } from "@/components/ui";

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
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
        {DIFFICULTY_LABEL[exam.difficulty]} exam · {exam.questionCount} questions
      </h1>

      {exam.attempts.length > 0 && (
        <p className="mt-2 text-sm text-zinc-500">
          Previous attempts:{" "}
          {exam.attempts.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ", "}
              <Link href={`/attempts/${a.id}`} className="underline hover:text-zinc-800">
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
            detail="Longer and harder exams take a bit more time, usually under a minute."
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

            <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-zinc-50/95 px-4 py-4 backdrop-blur">
              {submit.error && <div className="mb-3"><ErrorBox>{submit.error.message}</ErrorBox></div>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-zinc-600">
                  {answeredCount} of {exam.questions.length} answered
                </span>
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
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-5">
      <legend className="sr-only">Question {number}</legend>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Question {number} · {question.type === "MCQ" ? "Multiple choice" : "Short answer"}
      </p>
      <p className="mt-1.5 font-medium leading-relaxed text-zinc-900">{question.prompt}</p>

      {question.type === "MCQ" ? (
        <div className="mt-3 space-y-2">
          {question.choices.map((choice, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                answer?.selectedIndex === i ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={answer?.selectedIndex === i}
                onChange={() => onChange({ selectedIndex: i })}
                className="mt-0.5 accent-zinc-900"
              />
              <span className="text-zinc-800">
                <span className="mr-1.5 font-medium text-zinc-500">{LETTERS[i]}.</span>
                {choice}
              </span>
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
          className="mt-3 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
        />
      )}
    </fieldset>
  );
}
