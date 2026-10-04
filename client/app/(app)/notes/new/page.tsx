import type { Metadata } from "next";
import { BackLink } from "@/components/ui";
import { NewNoteForm } from "./new-note-form";

export const metadata: Metadata = {
  title: "New notes · Estudia Notes",
};

export default function NewNotePage() {
  return (
    <>
      <BackLink href="/dashboard">My notes</BackLink>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-900">Add notes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        We&apos;ll turn them into an exam-focused study guide, and then you can generate practice exams.
      </p>
      <NewNoteForm />
    </>
  );
}
