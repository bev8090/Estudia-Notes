"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Difficulty } from "@/lib/types";

// Creates an exam focused on specific topics of one note, then opens it.
// Used by "Practice weak topics" (progress page) and "Practice missed topics" (results page).
export function usePracticeExam() {
  const router = useRouter();
  return useMutation({
    mutationFn: (opts: { noteId: string; topicIds: string[]; difficulty?: Difficulty; questionCount?: 5 | 10 | 25 }) =>
      apiFetch<{ id: string }>(`/api/notes/${opts.noteId}/exams`, {
        method: "POST",
        body: JSON.stringify({
          difficulty: opts.difficulty ?? "STANDARD",
          questionCount: opts.questionCount ?? 10,
          focusTopicIds: opts.topicIds.slice(0, 8), // the API accepts up to 8
        }),
      }),
    onSuccess: ({ id }) => router.push(`/exams/${id}`),
  });
}
