"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DIFFICULTY_LABEL, SOURCE_LABEL, percent, shortDate } from "@/lib/format";
import type { NoteDetail } from "@/lib/types";
import { BackLink, ErrorBox, ProcessingPanel, Spinner, StatusBadge, buttonSecondary } from "@/components/ui";
import { ExamGenerator } from "./exam-generator";
import { StudyGuide } from "./study-guide";

export function NoteView({ id }: { id: string }) {
  const { data: note, error, isPending } = useQuery({
    queryKey: ["note", id],
    queryFn: () => apiFetch<NoteDetail>(`/api/notes/${id}`),
    // Poll while the summary or any exam is still being generated.
    refetchInterval: (query) => {
      const n = query.state.data;
      return n && (n.status === "PROCESSING" || n.exams.some((e) => e.status === "PROCESSING")) ? 2500 : false;
    },
  });

  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500">
        <Spinner /> Loading…
      </p>
    );
  }
  if (error) {
    return (
      <>
        <BackLink href="/dashboard">Your notes</BackLink>
        <div className="mt-4"><ErrorBox>{error.message}</ErrorBox></div>
      </>
    );
  }

  return (
    <>
      <BackLink href="/dashboard">Your notes</BackLink>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{note.title}</h1>
          <p className="mt-1 text-xs text-zinc-500">
            {SOURCE_LABEL[note.sourceType]} · added {shortDate(note.createdAt)}
          </p>
        </div>
        <DeleteNote id={id} />
      </div>

      <div className="mt-6">
        {note.status === "PROCESSING" && (
          <ProcessingPanel
            title="Summarizing your notes…"
            detail="This usually takes 10–60 seconds. You can leave this page and come back."
          />
        )}
        {note.status === "FAILED" && (
          <ErrorBox>
            {note.error ?? "Summarizing failed."} Delete this note and try uploading again.
          </ErrorBox>
        )}
        {note.status === "READY" && note.summary && (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <StudyGuide
              overview={note.summary.overview}
              examPriorities={note.summary.examPriorities}
              topics={note.summary.topics}
            />
            <aside className="space-y-6">
              <ExamGenerator noteId={id} topics={note.summary.topics} />
              <ExamHistory exams={note.exams} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function ExamHistory({ exams }: { exams: NoteDetail["exams"] }) {
  if (exams.length === 0) return null;
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Your exams</h2>
      <ul className="mt-3 divide-y divide-zinc-100">
        {exams.map((exam) => (
          <li key={exam.id}>
            <Link href={`/exams/${exam.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-zinc-900">
              <span className="text-zinc-800">
                {DIFFICULTY_LABEL[exam.difficulty]} · {exam.questionCount} questions
                <span className="block text-xs text-zinc-500">{shortDate(exam.createdAt)}</span>
              </span>
              {exam.status === "READY" ? (
                <span className="text-xs text-zinc-500">
                  {exam.bestScore != null ? `Best ${percent(exam.bestScore)}` : "Not taken"}
                </span>
              ) : (
                <StatusBadge status={exam.status} />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeleteNote({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => apiFetch(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["note", id] });
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push("/dashboard");
    },
  });

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm text-zinc-500 hover:text-red-600">
        Delete
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-600">Delete this note and its exams?</span>
      <button
        type="button"
        onClick={() => remove.mutate()}
        disabled={remove.isPending}
        className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {remove.isPending ? "Deleting…" : "Delete"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className={`${buttonSecondary} px-3! py-1.5!`}>
        Cancel
      </button>
      {remove.error && <span className="text-red-600">{remove.error.message}</span>}
    </div>
  );
}
