"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CircleCheck, FileText, Upload } from "lucide-react";
import { SAMPLE, type DemoGuide } from "@/lib/demo/sample";
import { loadDemo, saveDemo, type StoredDemo } from "@/lib/demo/storage";
import { StudyGuide } from "@/components/study-guide";
import { LockedExams } from "@/components/locked-exams";
import { DemoForm } from "./demo-form";

type Tab = "sample" | "yours";

export function DemoView() {
  const [tab, setTab] = useState<Tab>("sample");
  // Only shown on the "Your notes" tab, which never renders on the server, so reading
  // localStorage here can't cause a server/client mismatch.
  const [mine, setMine] = useState<StoredDemo | null>(() => loadDemo());
  const [usedElsewhere, setUsedElsewhere] = useState(false);

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Demo" className="inline-grid grid-cols-2 rounded-xl bg-brand-50 p-1 text-sm font-semibold">
        <TabButton active={tab === "sample"} onClick={() => setTab("sample")} icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}>
          Sample notes
        </TabButton>
        <TabButton active={tab === "yours"} onClick={() => setTab("yours")} icon={<Upload className="h-4 w-4" aria-hidden="true" />}>
          Your notes <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">1 free</span>
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "sample" && (
          <GuideLayout
            title={SAMPLE.title}
            guide={SAMPLE.guide}
            lockedMessage="Sign up free to generate exams from your own notes and track your progress."
            aside={<SampleNotes notes={SAMPLE.notes} />}
          />
        )}

        {tab === "yours" &&
          (mine ? (
            <>
              <p className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  This is your free study guide. <b>Create a free account</b> and we&apos;ll save it there, so you can
                  take practice exams on it.
                </span>
              </p>
              <GuideLayout
                title={mine.title}
                guide={mine.guide}
                lockedMessage="Create a free account and we'll save this study guide to it, so you can generate exams from it."
              />
            </>
          ) : usedElsewhere ? (
            <UsedPanel />
          ) : (
            <DemoForm
              onDone={(result) => {
                saveDemo(result);
                setMine(result);
              }}
              onUsed={() => setUsedElsewhere(true)}
            />
          ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2 ${
        active ? "bg-white text-brand-700 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function GuideLayout({ title, guide, lockedMessage, aside }: { title: string; guide: DemoGuide; lockedMessage: string; aside?: React.ReactNode }) {
  return (
    <>
      <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">{title}</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <StudyGuide overview={guide.overview} examPriorities={guide.examPriorities} topics={guide.topics} />
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <LockedExams message={lockedMessage} />
          {aside}
        </aside>
      </div>
    </>
  );
}

function SampleNotes({ notes }: { notes: string }) {
  return (
    <details className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <summary className="flex cursor-pointer items-center gap-2 font-display font-bold text-zinc-900">
        <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" /> The notes it was made from
      </summary>
      <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-700">
        {notes}
      </pre>
    </details>
  );
}

function UsedPanel() {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-brand-200 bg-white/80 px-6 py-14 text-center">
      <p className="font-display text-xl font-bold text-zinc-900">You&apos;ve used your free study guide</p>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        Create a free account to make study guides from all your notes, take practice exams, and track your weak topics.
      </p>
      <Link
        href="/login?mode=signup&from=demo"
        className="bg-ai-gradient mt-6 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-md shadow-brand-600/25"
      >
        Create a free account
      </Link>
    </div>
  );
}
