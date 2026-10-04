import { prisma } from "../lib/prisma.ts";
import { AiError } from "../lib/errors.ts";
import { summarizeNotes } from "./ai/summarize.ts";
import type { NoteInput } from "./extract.ts";

// Background half of "create a note": summarize, then save the summary and its topics
// and flip the note to READY in a single write.
export async function processNote(noteId: string, input: NoteInput, useAiTitle: boolean) {
  const { data, model } = await summarizeNotes(input.content);

  if (!data.usable || data.topics.length === 0) {
    throw new AiError(data.problem ?? "We couldn't find any study material in this upload.");
  }

  await prisma.note.update({
    where: { id: noteId },
    data: {
      status: "READY",
      error: null,
      ...(useAiTitle && { title: data.title.slice(0, 120) }),
      summary: {
        create: {
          overview: data.overview,
          examPriorities: data.examPriorities,
          model,
          topics: {
            create: data.topics.map((t, order) => ({
              name: t.name,
              order,
              keyPoints: t.keyPoints,
              keyTerms: t.keyTerms,
              importance: t.importance,
              examTips: t.examTips,
              pitfalls: t.pitfalls,
            })),
          },
        },
      },
    },
  });
}
