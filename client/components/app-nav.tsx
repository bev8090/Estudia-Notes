"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, LayoutDashboard, Plus, type LucideIcon } from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean }[] = [
  {
    href: "/dashboard",
    label: "My notes",
    icon: LayoutDashboard,
    // Notes, exams and results all live "under" My notes.
    match: (p) => p === "/dashboard" || (p.startsWith("/notes") && p !== "/notes/new") || p.startsWith("/exams") || p.startsWith("/attempts"),
  },
  { href: "/progress", label: "Progress", icon: ChartLine, match: (p) => p.startsWith("/progress") },
];

// Primary navigation for signed-in pages, with the current section highlighted.
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
              active ? "bg-brand-50 text-brand-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function NewNotesButton() {
  const pathname = usePathname();
  if (pathname === "/notes/new") return null;
  return (
    <Link
      href="/notes/new"
      className="bg-ai-gradient inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-transform hover:-translate-y-px"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">New notes</span>
      <span className="sr-only sm:hidden">New notes</span>
    </Link>
  );
}
