"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileUp, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { SOURCE_LABEL, shortDate } from "@/lib/format";
import type { NoteListItem } from "@/lib/types";
import { ErrorBox, SourceIcon, Spinner, StatusBadge, buttonPrimary } from "@/components/ui";

export function NotesList() {
  const { data: notes, error, isPending } = useQuery({
    queryKey: ["notes"],
    queryFn: () => apiFetch<NoteListItem[]>("/api/notes"),
    // Keep checking while any note is still being summarized.
    refetchInterval: (query) => (query.state.data?.some((n) => n.status === "PROCESSING") ? 3000 : false),
  });

  if (isPending) {
    return (
      <p className="mt-10 flex items-center gap-2 text-sm text-zinc-500">
        <Spinner /> Loading your notes…
      </p>
    );
  }
  if (error) return <div className="mt-8"><ErrorBox>{error.message}</ErrorBox></div>;

  if (notes.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-2xl border-2 border-dashed border-brand-200 bg-white/80 px-6 py-16 text-center">
        <span className="bg-ai-gradient inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-brand-600/30">
          <FileUp className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-5 font-display text-xl font-bold text-zinc-900">Add your first notes</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Paste text or upload a PDF, Word doc, PowerPoint slides or photos of your notes. We&apos;ll turn them into an
          exam-focused study guide.
        </p>
        <Link href="/notes/new" className={`${buttonPrimary} mt-6`}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New notes
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            href={`/notes/${note.id}`}
            className="group flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md hover:shadow-brand-900/5"
          >
            <div className="flex items-start justify-between gap-3">
              <SourceIcon type={note.sourceType} />
              <StatusBadge status={note.status} />
            </div>
            <h2 className="mt-4 font-display text-lg leading-snug font-bold text-zinc-900 group-hover:text-brand-700">
              {note.title}
            </h2>
            <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-zinc-500">
              <span>
                {SOURCE_LABEL[note.sourceType]} · {shortDate(note.createdAt)}
              </span>
              {note.examCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                  <ClipboardList className="h-3 w-3" aria-hidden="true" />
                  {note.examCount} exam{note.examCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
