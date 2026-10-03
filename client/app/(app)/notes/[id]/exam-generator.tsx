"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABEL } from "@/lib/format";
import type { Difficulty, Topic } from "@/lib/types";
import { ErrorBox, Spinner, buttonPrimary } from "@/components/ui";

const DIFFICULTIES: { value: Difficulty; blurb: string }[] = [
  { value: "STANDARD", blurb: "Recall key points and definitions" },
  { value: "HARD", blurb: "Apply ideas and connect concepts" },
  { value: "CHALLENGE", blurb: "Scenarios, edge cases, tricky choices" },
];
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
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold text-zinc-900">Practice exam</h2>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-700">Difficulty</legend>
        <div className="mt-2 space-y-2">
          {DIFFICULTIES.map((d) => (
            <label
              key={d.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                difficulty === d.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name="difficulty"
                checked={difficulty === d.value}
                onChange={() => setDifficulty(d.value)}
                className="mt-0.5 accent-zinc-900"
              />
              <span>
                <span className="font-medium text-zinc-900">{DIFFICULTY_LABEL[d.value]}</span>
                <span className="block text-xs text-zinc-500">{d.blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-700">Questions</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={questionCount === n}
              onClick={() => setQuestionCount(n)}
              className={`rounded-lg border py-2 text-sm font-medium ${
                questionCount === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">About 70% multiple choice, 30% short answer.</p>
      </fieldset>

      {topics.length > 1 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-zinc-700">
            Focus on topics {focusTopicIds.length > 0 && `(${focusTopicIds.length})`}
          </summary>
          <div className="mt-2 space-y-1.5">
            {topics.map((t) => (
              <label key={t.id} className="flex items-start gap-2 text-zinc-700">
                <input
                  type="checkbox"
                  checked={focusTopicIds.includes(t.id)}
                  onChange={() => toggleTopic(t.id)}
                  className="mt-0.5 accent-zinc-900"
                />
                {t.name}
              </label>
            ))}
            <p className="text-xs text-zinc-500">Leave all unchecked to cover every topic.</p>
          </div>
        </details>
      )}

      {create.error && <div className="mt-4"><ErrorBox>{create.error.message}</ErrorBox></div>}

      <button type="button" onClick={() => create.mutate()} disabled={create.isPending} className={`${buttonPrimary} mt-5 w-full`}>
        {create.isPending ? <><Spinner /> Starting…</> : "Generate exam"}
      </button>
    </section>
  );
}
