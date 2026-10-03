import Link from "next/link";
import type { ReactNode } from "react";
import type { JobStatus } from "@/lib/types";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function StatusBadge({ status }: { status: JobStatus }) {
  if (status === "READY") return null;
  return status === "PROCESSING" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
      <Spinner className="h-3 w-3" /> Processing
    </span>
  ) : (
    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Failed</span>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </p>
  );
}

// Full-width message used while a background job runs ("Summarizing your notes…").
export function ProcessingPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white px-6 py-14 text-center">
      <Spinner className="h-7 w-7 text-zinc-400" />
      <p className="mt-4 font-medium text-zinc-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm text-zinc-500 hover:text-zinc-800">
      ← {children}
    </Link>
  );
}

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60";
export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60";
