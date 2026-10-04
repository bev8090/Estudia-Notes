import Link from "next/link";
import {
  ArrowRight,
  Camera,
  ChartLine,
  Check,
  FileText,
  FileUp,
  Gauge,
  Highlighter,
  Image as ImageIcon,
  PenLine,
  Presentation,
  ShieldCheck,
  Sparkles,
  Target,
  Type,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand";
import { HeroCollage } from "@/components/landing/hero-collage";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const cta = signedIn ? { href: "/dashboard", label: "Go to your notes" } : { href: "/login", label: "Get started" };

  return (
    <div className="bg-notebook flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <a href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-900 md:inline">
              How it works
            </a>
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-900 md:inline">
              Features
            </a>
            {!signedIn && (
              <Link href="/login" className="rounded-lg px-3 py-2 font-medium text-zinc-700 hover:text-zinc-900">
                Sign in
              </Link>
            )}
            <Link
              href={cta.href}
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
            >
              {cta.label}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm">
              <Sparkles className="animate-sparkle h-4 w-4 text-fuchsia-500" />
              AI study guides and practice exams
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-zinc-900 sm:text-6xl">
              Study smarter. Walk into every exam <span className="highlight">prepared.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600">
              Upload your notes, slides or photos of handwritten pages. Estudia Notes turns them into a study guide that
              shows <span className="font-medium text-zinc-900">what&apos;s most likely to be tested</span>, then
              quizzes you at the difficulty you choose.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={cta.href}
                className="bg-ai-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:-translate-y-0.5"
              >
                {cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-800 transition-colors hover:border-zinc-400"
              >
                See how it works
              </a>
            </div>
            <FormatStrip />
          </div>
          <HeroCollage />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-brand-100 bg-white/70 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="How it works" title="From messy notes to exam-ready in three steps" />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              <Step
                n={1}
                icon={FileUp}
                color="bg-sky-100 text-sky-700"
                title="Upload your notes"
                body="Drop in a PDF, PowerPoint, Word doc or text file, or snap up to 10 photos of handwritten pages."
              />
              <Step
                n={2}
                icon={Sparkles}
                color="bg-violet-100 text-violet-700"
                title="Get an exam-focused study guide"
                body="AI explains each topic, ranks what's most likely to be tested, and flags the mistakes students usually make."
              />
              <Step
                n={3}
                icon={Target}
                color="bg-emerald-100 text-emerald-700"
                title="Practice and improve"
                body="Take exams at Standard, Hard or Challenge level, get instant feedback, and drill the topics you miss."
              />
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Features" title="Everything you need to study with purpose" />
            <div className="mt-12 grid gap-5 md:grid-cols-6">
              <FeatureCard
                className="md:col-span-4"
                icon={Highlighter}
                color="bg-yellow-100 text-yellow-800"
                title="A study guide, not just a summary"
                body="Every topic gets clear explanations, key terms, “be able to…” checklists, and the common mistakes to watch out for."
              >
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Know for the exam</p>
                    <p className="mt-1.5 flex gap-1.5 text-zinc-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />Be able to explain why the cycle turns twice per glucose.</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">Watch out</p>
                    <p className="mt-1.5 text-amber-950">Don&apos;t place glycolysis in the mitochondria.</p>
                  </div>
                </div>
              </FeatureCard>
              <FeatureCard
                className="md:col-span-2"
                icon={Gauge}
                color="bg-rose-100 text-rose-700"
                title="Three levels of difficulty"
                body="Warm up with recall, then push into application and tricky scenarios."
              >
                <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Standard</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">Hard</span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Challenge</span>
                </div>
              </FeatureCard>
              <FeatureCard
                className="md:col-span-2"
                icon={PenLine}
                color="bg-violet-100 text-violet-700"
                title="Written answers, graded by AI"
                body="Short answers get partial credit and specific feedback, not just right or wrong."
              >
                <p className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-sm text-violet-950">
                  “You correctly explained the H⁺ gradient, but missed what happens without oxygen.”
                </p>
              </FeatureCard>
              <FeatureCard
                className="md:col-span-2"
                icon={ChartLine}
                color="bg-sky-100 text-sky-700"
                title="Finds your weak topics"
                body="See accuracy per topic, then generate an exam on just the topics you keep missing."
              >
                <div className="mt-5 space-y-2" aria-hidden="true">
                  {[
                    ["Krebs cycle", 92],
                    ["Electron transport", 64],
                    ["Fermentation", 45],
                  ].map(([name, value]) => (
                    <div key={name} className="text-xs text-zinc-600">
                      <div className="flex justify-between">
                        <span>{name}</span>
                        <span className="font-medium text-zinc-900">{value}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-zinc-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </FeatureCard>
              <FeatureCard
                className="md:col-span-2"
                icon={Camera}
                color="bg-orange-100 text-orange-700"
                title="Reads handwriting and slides"
                body="Photos of handwritten pages, scanned PDFs, and lecture slides including your instructor's speaker notes."
              />
              <FeatureCard
                className="md:col-span-3"
                icon={Sparkles}
                color="bg-fuchsia-100 text-fuchsia-700"
                title="Practice that matches what you studied"
                body="Exams are built from your own study guide: more questions on high-priority topics, and wrong answers based on the mistakes students really make."
              />
              <FeatureCard
                className="md:col-span-3"
                icon={ShieldCheck}
                color="bg-emerald-100 text-emerald-700"
                title="Your notes stay yours"
                body="Uploaded files are read once and never stored. Only you can see your notes, exams and results."
              />
            </div>
          </div>
        </section>

        {/* Why it works */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 rounded-3xl border border-brand-100 bg-white p-8 shadow-sm sm:p-12 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="font-hand text-2xl text-brand-600">the secret?</p>
                <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                  Testing yourself beats rereading
                </h2>
                <p className="mt-4 leading-relaxed text-zinc-600">
                  Learning research consistently finds that practicing recall leads to better exam results than
                  rereading or highlighting alone. Estudia Notes makes that the easy option.
                </p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <WhyItem title="Focus where it counts" body="The study guide ranks what matters, so you spend time on the concepts most likely to be tested." />
                <WhyItem title="Feedback right away" body="See why each answer is right or wrong while the material is still fresh." />
                <WhyItem title="Close the gaps" body="Your weakest topics become your next practice exam, automatically." />
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="bg-ai-gradient relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-14 text-center text-white shadow-xl shadow-brand-900/20">
            <div className="absolute -top-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -right-10 -bottom-16 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-2xl" aria-hidden="true" />
            <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your next exam is coming. Be ready for it.
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-brand-100">
              Turn tonight&apos;s notes into a study guide and a practice exam in about a minute.
            </p>
            <Link
              href={cta.href}
              className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-100 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:px-6">
          <Logo />
          <p>Built with Next.js, Express, Supabase and Claude.</p>
        </div>
      </footer>
    </div>
  );
}

const FORMATS: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: FileText, label: "PDF", color: "text-red-600" },
  { icon: Presentation, label: "Slides", color: "text-orange-600" },
  { icon: FileText, label: "Word", color: "text-blue-600" },
  { icon: ImageIcon, label: "Photos", color: "text-emerald-600" },
  { icon: Type, label: "Text", color: "text-violet-600" },
];

function FormatStrip() {
  return (
    <div className="mt-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Works with</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {FORMATS.map(({ icon: Icon, label, color }) => (
          <li key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700">
            <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h2>
    </div>
  );
}

function Step({ n, icon: Icon, color, title, body }: { n: number; icon: LucideIcon; color: string; title: string; body: string }) {
  return (
    <li className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <span className="absolute top-5 right-6 font-display text-5xl font-extrabold text-brand-100" aria-hidden="true">
        {n}
      </span>
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-zinc-900">
        <span className="sr-only">Step {n}: </span>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
    </li>
  );
}

function FeatureCard({
  icon: Icon,
  color,
  title,
  body,
  className = "",
  children,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  body: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{body}</p>
      {children}
    </div>
  );
}

function WhyItem({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-2xl bg-brand-50/70 p-5">
      <p className="font-display font-bold text-brand-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{body}</p>
    </li>
  );
}
