import type { Metadata } from "next";
import { NotesList } from "./notes-list";

export const metadata: Metadata = {
  title: "My notes · Estudia Notes",
};

export default function DashboardPage() {
  return (
    <>
      <div>
        <p className="font-hand text-2xl leading-none text-brand-600">ready to study?</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-zinc-900">My notes</h1>
        <p className="mt-1 text-sm text-zinc-500">Open a note to review its study guide or take a practice exam.</p>
      </div>
      <NotesList />
    </>
  );
}
