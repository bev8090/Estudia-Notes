"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { FileUp, Sparkles, Type, Upload } from "lucide-react";
import { ErrorBox, Spinner, inputClass } from "@/components/ui";

type Mode = "text" | "files";

// Mirrors the server's limits (server/src/services/extract.ts) so problems show up
// before uploading. The server still checks everything; this is only for convenience.
const MIN_CHARS = 50;
const MAX_CHARS = 300_000;
const MAX_IMAGES = 10;
const MAX_TOTAL_MB = 20;
const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,image/jpeg,image/png,image/webp,image/gif";
const isImage = (f: File) => /^image\/(jpeg|png|webp|gif)$/.test(f.type);

function checkFiles(files: File[]): string | undefined {
  if (files.length === 0) return "Choose a file to upload.";
  if (files.some((f) => /\.(heic|heif)$/i.test(f.name))) {
    return "HEIC photos aren't supported. Please convert them to JPEG or PNG first.";
  }
  if (files.some((f) => /\.(ppt|doc)$/i.test(f.name))) {
    return "Older .ppt and .doc files aren't supported. Save them as .pptx, .docx or PDF first.";
  }
  const totalMb = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;
  if (totalMb > MAX_TOTAL_MB) return `Uploads are limited to ${MAX_TOTAL_MB} MB in total.`;
  if (files.length > 1 && !files.every(isImage)) return "Upload one document at a time, or up to 10 photos.";
  if (files.length > MAX_IMAGES) return `Upload at most ${MAX_IMAGES} photos at a time.`;
}

export function NewNoteForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    // Photos accumulate (several pages); a document replaces whatever was there.
    setFiles((current) => (incoming.every(isImage) && current.every(isImage) ? [...current, ...incoming] : incoming));
    setError(undefined);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem =
      mode === "text"
        ? text.trim().length < MIN_CHARS
          ? `Notes need at least ${MIN_CHARS} characters.`
          : text.length > MAX_CHARS
            ? `Notes are limited to ${MAX_CHARS.toLocaleString()} characters.`
            : undefined
        : checkFiles(files);
    if (problem) {
      setError(problem);
      return;
    }

    // Multipart form data carries both text fields and binary files in one request.
    const form = new FormData();
    if (title.trim()) form.append("title", title.trim());
    if (mode === "text") form.append("text", text);
    else files.forEach((f) => form.append("files", f));

    setPending(true);
    setError(undefined);
    try {
      const { id } = await apiFetch<{ id: string }>("/api/notes", { method: "POST", body: form });
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push(`/notes/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-7">
      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">Title <span className="font-normal text-zinc-400">(optional)</span></span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Leave blank and we'll name it for you"
          className={`${inputClass} mt-1`}
        />
      </label>

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
            {m === "text" ? <><Type className="h-4 w-4" aria-hidden="true" /> Paste text</> : <><Upload className="h-4 w-4" aria-hidden="true" /> Upload files</>}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <label className="block">
          <span className="sr-only">Notes</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            placeholder="Paste your notes here…"
            className={`${inputClass} leading-relaxed`}
          />
          <span className="mt-1 block text-right text-xs text-zinc-400">{text.length.toLocaleString()} characters</span>
        </label>
      ) : (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-brand-50/30 hover:border-brand-400 hover:bg-brand-50/60"
            }`}
          >
            <span className="bg-ai-gradient inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md shadow-brand-600/25">
              <FileUp className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-800">Drop files here or click to choose</p>
            <p className="mt-1 text-xs text-zinc-500">
              One PDF, Word (.docx), PowerPoint (.pptx), .txt or .md file, or up to 10 photos (JPEG, PNG, WebP). 20 MB max.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = ""; // allow choosing the same file again
              }}
            />
          </div>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                  <span className="truncate text-zinc-800">
                    {isImage(f) && files.length > 1 ? `Page ${i + 1}: ` : ""}
                    {f.name}
                    <span className="ml-2 text-xs text-zinc-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                    className="ml-3 cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <button
        type="submit"
        disabled={pending}
        className="bg-ai-gradient inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <><Spinner /> Uploading…</> : <><Sparkles className="h-4 w-4" aria-hidden="true" /> Build my study guide</>}
      </button>
    </form>
  );
}
