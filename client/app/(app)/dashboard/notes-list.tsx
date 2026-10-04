"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { SOURCE_LABEL, shortDate } from "@/lib/format";
import type { NoteListItem } from "@/lib/types";
import { ErrorBox, Spinner, StatusBadge } from "@/components/ui";

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
      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
        <p className="font-medium text-zinc-900">No notes yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Paste text or upload a PDF, Word doc, PowerPoint slides or photos of your notes to get started.
        </p>
        <Link href="/notes/new" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline">
          Add your first notes
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            href={`/notes/${note.id}`}
            className="block h-full rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-medium text-zinc-900">{note.title}</h2>
              <StatusBadge status={note.status} />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {SOURCE_LABEL[note.sourceType]} · {shortDate(note.createdAt)}
              {note.examCount > 0 && ` · ${note.examCount} exam${note.examCount === 1 ? "" : "s"}`}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
