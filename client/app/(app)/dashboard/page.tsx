import type { Metadata } from "next";
import Link from "next/link";
import { buttonPrimary } from "@/components/ui";
import { NotesList } from "./notes-list";

export const metadata: Metadata = {
  title: "Dashboard · Estudia Notes",
};

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Your notes</h1>
          <p className="mt-1 text-sm text-zinc-500">Pick a note to review its summary or practice with an exam.</p>
        </div>
        <Link href="/notes/new" className={buttonPrimary}>
          + New notes
        </Link>
      </div>
      <NotesList />
    </>
  );
}
