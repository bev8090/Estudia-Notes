"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// Temporary Phase 1 check: proves the browser → Express → Supabase token check works end to end.
export function ApiStatus() {
  const [state, setState] = useState<{ ok: boolean; text: string }>();

  useEffect(() => {
    apiFetch<{ userId: string }>("/api/me")
      .then(({ userId }) => setState({ ok: true, text: `API connected as ${userId}` }))
      .catch((err: Error) => setState({ ok: false, text: `API check failed: ${err.message}` }));
  }, []);

  if (!state) return <p className="mt-6 text-sm text-zinc-400">Checking API connection…</p>;
  return (
    <p className={`mt-6 text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.text}</p>
  );
}
