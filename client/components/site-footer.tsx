import Link from "next/link";
import { Logo } from "@/components/brand";
import { SITE_NAME } from "@/lib/site";

// Footer for public pages (landing, privacy, terms).
export function SiteFooter() {
  return (
    <footer className="border-t border-brand-100 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:px-6">
        <Logo />
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-brand-700">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-brand-700">
            Terms of Service
          </Link>
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
        </nav>
      </div>
    </footer>
  );
}
