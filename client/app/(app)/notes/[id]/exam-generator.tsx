"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABEL } from "@/lib/format";
import type { Difficulty, Topic } from "@/lib/types";
import { Check, Sparkles } from "lucide-react";
import { ErrorBox, Spinner } from "@/components/ui";
import { DIFFICULTY_STYLE } from "@/components/difficulty";

const DIFFICULTIES: Difficulty[] = ["STANDARD", "HARD", "CHALLENGE"];
const COUNTS = [5, 10, 25] as const;

export function ExamGenerator({ noteId, topics }: { noteId: string; topics: Topic[] }) {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("STANDARD");
  const [questionCount, setQuestionCount] = useState<(typeof COUNTS)[number]>(10);
  const [focusTopicIds, setFocusTopicIds] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(`/api/notes/${noteId}/exams`, {
        method: "POST",
        body: JSON.stringify({ difficulty, questionCount, focusTopicIds }),
      }),
    onSuccess: ({ id }) => router.push(`/exams/${id}`),
  });

  const toggleTopic = (id: string) =>
    setFocusTopicIds((cur) => (cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]));

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

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-zinc-700">Difficulty</legend>
        <div className="mt-2 space-y-2">
          {DIFFICULTIES.map((d) => {
            const style = DIFFICULTY_STYLE[d];
            const Icon = style.icon;
            const selected = difficulty === d;
            return (
              <label
                key={d}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                  selected ? style.selected : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <input type="radio" name="difficulty" checked={selected} onChange={() => setDifficulty(d)} className="sr-only" />
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBox}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="font-semibold text-zinc-900">{DIFFICULTY_LABEL[d]}</span>
                  <span className="block text-xs text-zinc-500">{style.blurb}</span>
                </span>
                {selected && <Check className="h-4 w-4 text-zinc-700" aria-hidden="true" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-zinc-700">Questions</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={questionCount === n}
              onClick={() => setQuestionCount(n)}
              className={`h-10 cursor-pointer rounded-xl border text-sm font-semibold transition-colors ${
                questionCount === n
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                  : "border-zinc-200 text-zinc-700 hover:border-brand-300 hover:bg-brand-50/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">About 70% multiple choice, 30% short answer.</p>
      </fieldset>

      {topics.length > 1 && (
        <details className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm">
          <summary className="cursor-pointer font-semibold text-zinc-700">
            Focus on topics {focusTopicIds.length > 0 && `(${focusTopicIds.length})`}
          </summary>
          <div className="mt-2 space-y-2">
            {topics.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-start gap-2 text-zinc-700">
                <input
                  type="checkbox"
                  checked={focusTopicIds.includes(t.id)}
                  onChange={() => toggleTopic(t.id)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                {t.name}
              </label>
            ))}
            <p className="text-xs text-zinc-500">Leave all unchecked to cover every topic.</p>
          </div>
        </details>
      )}

      {create.error && <div className="mt-4"><ErrorBox>{create.error.message}</ErrorBox></div>}

      <button
        type="button"
        onClick={() => create.mutate()}
        disabled={create.isPending}
        className="bg-ai-gradient mt-5 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {create.isPending ? <><Spinner /> Starting…</> : <><Sparkles className="h-4 w-4" aria-hidden="true" /> Generate exam</>}
      </button>
    </section>
  );
}
