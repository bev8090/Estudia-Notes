import type { Metadata } from "next";
import { BackLink } from "@/components/ui";
import { NewNoteForm } from "./new-note-form";

export const metadata: Metadata = {
  title: "New notes · Estudia Notes",
};

export default function NewNotePage() {
  return (
    <>
      <BackLink href="/dashboard">Your notes</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Add notes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        We&apos;ll summarize them into topics, and then you can generate practice exams.
      </p>
      <NewNoteForm />
    </>
  );
}
