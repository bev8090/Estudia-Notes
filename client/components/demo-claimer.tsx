"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { clearDemo, loadDemo } from "@/lib/demo/storage";

// Runs on signed-in pages. If this browser made a free demo study guide before signing
// up, save it to the account (once) and open it, so the user can take exams on it.
export function DemoClaimer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const demo = loadDemo();
    if (!demo) return;

    apiFetch<{ noteId: string }>(`/api/demo/${demo.id}/claim`, { method: "POST" })
      .then(async ({ noteId }) => {
        clearDemo();
        await queryClient.invalidateQueries({ queryKey: ["notes"] });
        router.push(`/notes/${noteId}`);
      })
      .catch((err) => {
        // Expired or already saved elsewhere: forget it. Network errors: try again next visit.
        if (err instanceof ApiError && (err.status === 404 || err.status === 409)) clearDemo();
      });
  }, [queryClient, router]);

  return null;
}
