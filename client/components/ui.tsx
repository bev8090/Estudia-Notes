import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CircleAlert, FileText, Image as ImageIcon, Presentation, Sparkles, Type, type LucideIcon } from "lucide-react";
import type { JobStatus, SourceType } from "@/lib/types";
import { SOURCE_LABEL } from "@/lib/format";

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
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
      <Sparkles className="animate-sparkle h-3 w-3" aria-hidden="true" /> AI working
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
      <CircleAlert className="h-3 w-3" aria-hidden="true" /> Failed
    </span>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// Shown while a background AI job runs ("Building your study guide…").
export function ProcessingPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-brand-100 bg-white px-6 py-14 text-center shadow-sm">
      <div className="relative" aria-hidden="true">
        <div className="bg-ai-gradient absolute inset-0 rounded-2xl opacity-30 blur-xl" />
        <div className="bg-ai-gradient relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-brand-600/30">
          <Sparkles className="animate-sparkle h-7 w-7" />
        </div>
      </div>
      <p role="status" className="mt-5 font-display text-lg font-bold text-zinc-900">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-brand-700">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {children}
    </Link>
  );
}

// Each upload type gets its own icon and color, always alongside a text label.
const SOURCE_STYLE: Record<SourceType, { icon: LucideIcon; className: string }> = {
  PDF: { icon: FileText, className: "bg-red-50 text-red-600" },
  PPTX: { icon: Presentation, className: "bg-orange-50 text-orange-600" },
  DOCX: { icon: FileText, className: "bg-blue-50 text-blue-600" },
  IMAGE: { icon: ImageIcon, className: "bg-emerald-50 text-emerald-600" },
  TEXT: { icon: Type, className: "bg-violet-50 text-violet-600" },
};

export function SourceIcon({ type, className = "h-10 w-10" }: { type: SourceType; className?: string }) {
  const { icon: Icon, className: color } = SOURCE_STYLE[type];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${color} ${className}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{SOURCE_LABEL[type]}</span>
    </span>
  );
}

export const card = "rounded-2xl border border-zinc-200/80 bg-white shadow-sm";

export const buttonPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";
export const buttonSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";
export const inputClass =
  "block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
