import type { Difficulty, SourceType } from "./types";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  STANDARD: "Standard",
  HARD: "Hard",
  CHALLENGE: "Challenge",
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  TEXT: "Text",
  PDF: "PDF",
  DOCX: "Word",
  PPTX: "Slides",
  IMAGE: "Photos",
};

export function percent(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const LETTERS = "ABCD";
