import Link from "next/link";

// The brand mark: an open notebook with an AI sparkle in the corner. The gradient tile
// is CSS (not an SVG <linearGradient>), because SVG gradient ids are page-global and
// break when the first copy of the logo sits inside a hidden element.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`bg-ai-gradient inline-flex shrink-0 rounded-[28%] ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" className="h-full w-full">
        {/* open notebook */}
        <path d="M8 10.5c2.6-.9 5-.6 7 .9v11.1c-2-1.4-4.4-1.7-7-.8z" fill="#fff" fillOpacity="0.95" />
        <path d="M24 10.5c-2.6-.9-5-.6-7 .9v11.1c2-1.4 4.4-1.7 7-.8z" fill="#fff" fillOpacity="0.75" />
        {/* sparkle */}
        <path d="M24.5 4.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="#fde047" />
      </svg>
    </span>
  );
}

// compact: hide the wordmark on phones (used in the app header, where space is tight).
export function Logo({ href = "/", className = "", compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 rounded-lg ${className}`}>
      <LogoMark />
      <span
        className={`font-display text-lg font-bold tracking-tight whitespace-nowrap text-zinc-900 ${compact ? "hidden sm:inline" : ""}`}
      >
        Estudia<span className="text-brand-600"> Notes</span>
      </span>
      {compact && <span className="sr-only sm:hidden">Estudia Notes</span>}
    </Link>
  );
}

// Hand-drawn style arrow for handwritten annotations.
export function ScribbleArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 8c14 18 34 24 62 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M58 18l9 8-11 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
