import { BookOpen, Flame, Mountain, type LucideIcon } from "lucide-react";
import { DIFFICULTY_LABEL } from "@/lib/format";
import type { Difficulty } from "@/lib/types";

// One color + icon per difficulty, always shown with its name (never color alone).
export const DIFFICULTY_STYLE: Record<
  Difficulty,
  { icon: LucideIcon; blurb: string; chip: string; selected: string; iconBox: string }
> = {
  STANDARD: {
    icon: BookOpen,
    blurb: "Recall key points and definitions",
    chip: "bg-emerald-50 text-emerald-800",
    selected: "border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-400",
    iconBox: "bg-emerald-100 text-emerald-700",
  },
  HARD: {
    icon: Flame,
    blurb: "Apply ideas and connect concepts",
    chip: "bg-amber-50 text-amber-900",
    selected: "border-amber-400 bg-amber-50/60 ring-1 ring-amber-400",
    iconBox: "bg-amber-100 text-amber-700",
  },
  CHALLENGE: {
    icon: Mountain,
    blurb: "Scenarios, edge cases, tricky choices",
    chip: "bg-rose-50 text-rose-800",
    selected: "border-rose-400 bg-rose-50/60 ring-1 ring-rose-400",
    iconBox: "bg-rose-100 text-rose-700",
  },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { icon: Icon, chip } = DIFFICULTY_STYLE[difficulty];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}
