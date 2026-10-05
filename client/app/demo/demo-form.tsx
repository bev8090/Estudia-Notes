"use client";

import { useRef, useState, type FormEvent } from "react";
import { FileUp, Sparkles, Type, Upload } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import type { StoredDemo } from "@/lib/demo/storage";
import { ErrorBox, ProcessingPanel, inputClass } from "@/components/ui";

// Mirrors the server's demo limits (server/src/services/extract.ts DEMO_LIMITS).
const MIN_CHARS = 50;
const MAX_CHARS = 20_000;
const MAX_MB = 5;
const MAX_PHOTOS = 3;
const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,image/jpeg,image/png,image/webp,image/gif";
const isImage = (f: File) => /^image\/(jpeg|png|webp|gif)$/.test(f.type);

function checkFiles(files: File[]): string | undefined {
  if (files.length === 0) return "Choose a file to upload.";
  if (files.some((f) => /\.(heic|heif)$/i.test(f.name))) return "HEIC photos aren't supported. Please convert them to JPEG or PNG first.";
  if (files.some((f) => /\.(ppt|doc)$/i.test(f.name))) return "Older .ppt and .doc files aren't supported. Save them as .pptx, .docx or PDF first.";
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_MB * 1024 * 1024) return `The free demo accepts up to ${MAX_MB} MB.`;
  if (files.length > 1 && !files.every(isImage)) return `Upload one document, or up to ${MAX_PHOTOS} photos.`;
  if (files.length > MAX_PHOTOS) return `The free demo accepts up to ${MAX_PHOTOS} photos.`;
}

export function DemoForm({ onDone, onUsed }: { onDone: (result: StoredDemo) => void; onUsed: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"text" | "files">("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem =
      mode === "text"
        ? text.trim().length < MIN_CHARS
          ? `Notes need at least ${MIN_CHARS} characters.`
          : text.length > MAX_CHARS
            ? `The free demo accepts up to ${MAX_CHARS.toLocaleString()} characters.`
            : undefined
        : checkFiles(files);
    if (problem) {
      setError(problem);
      return;
    }

    const form = new FormData();
    if (mode === "text") form.append("text", text);
    else files.forEach((f) => form.append("files", f));

    setPending(true);
    setError(undefined);
    try {
      onDone(await apiFetch<StoredDemo>("/api/demo/study-guide", { method: "POST", body: form }));
    } catch (err) {
      if (err instanceof ApiError && err.code === "DEMO_USED") onUsed();
      else setError((err as Error).message);
      setPending(false);
    }
  }

  if (pending) {
    return (
      <ProcessingPanel
        title="Building your study guide…"
        detail="AI is reading your notes and working out what's most likely to be on the exam. This usually takes 15–40 seconds; please keep this page open."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <h2 className="font-display text-xl font-bold text-zinc-900">Make a study guide from your notes</h2>
        <p className="mt-1 text-sm text-zinc-500">
          One free study guide, no account needed. Up to {MAX_CHARS.toLocaleString()} characters, or one file up to{" "}
          {MAX_MB} MB, or {MAX_PHOTOS} photos.
        </p>
      </div>

      <div role="tablist" className="inline-grid grid-cols-2 rounded-xl bg-brand-50 p-1 text-sm font-semibold">
        {(["text", "files"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(undefined);
            }}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 ${mode === m ? "bg-white text-brand-700 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            {m === "text" ? <><Type className="h-4 w-4" aria-hidden="true" /> Paste text</> : <><Upload className="h-4 w-4" aria-hidden="true" /> Upload file</>}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <label className="block">
          <span className="sr-only">Notes</span>
          <textarea
            id="demo-notes"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Paste your class notes here…"
            className={`${inputClass} leading-relaxed`}
          />
          <span className={`mt-1 block text-right text-xs ${text.length > MAX_CHARS ? "text-red-600" : "text-zinc-400"}`}>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </span>
        </label>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/30 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/60"
          >
            <span className="bg-ai-gradient inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md shadow-brand-600/25">
              <FileUp className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-4 text-sm font-semibold text-zinc-800">Choose a file</span>
            <span className="mt-1 text-xs text-zinc-500">PDF, PowerPoint, Word, .txt/.md, or up to {MAX_PHOTOS} photos</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              setFiles(Array.from(e.target.files ?? []));
              setError(undefined);
              e.target.value = "";
            }}
          />
          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="truncate rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                  {f.name} <span className="ml-1 text-xs text-zinc-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <button
        type="submit"
        className="bg-ai-gradient inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-transform hover:-translate-y-px"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" /> Build my free study guide
      </button>
    </form>
  );
}
