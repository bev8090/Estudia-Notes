import type Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { HttpError } from "../lib/errors.ts";

export type SourceType = "TEXT" | "PDF" | "DOCX" | "IMAGE";

// Everything the summarizer needs, prepared during the upload request so bad files
// are rejected immediately with a 400 instead of failing later in the background.
export type NoteInput = {
  sourceType: SourceType;
  rawText: string | null; // kept for text-based notes; PDFs and photos are read by Claude directly
  content: Anthropic.ContentBlockParam[];
};

export type UploadedFile = { originalname: string; buffer: Buffer };

export const MIN_TEXT_CHARS = 50;
export const MAX_TEXT_CHARS = 300_000; // ~100k tokens, roughly $0.20 to summarize on Sonnet 5.5
export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // Claude's limit is 10 MB after base64 (+33%)
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // stays under Claude's 32 MB request limit

type Kind = "pdf" | "docx" | "text" | "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "heic";

// Identify a file from its first bytes ("magic numbers") rather than trusting the
// browser-supplied MIME type or extension, which can be missing or wrong.
export function sniff(file: UploadedFile): Kind | null {
  const b = file.buffer;
  const ascii = (start: number, end: number) => b.subarray(start, end).toString("latin1");
  if (ascii(0, 5) === "%PDF-") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /^(heic|heix|mif1|msf1|heim|heis)$/.test(ascii(8, 12))) return "heic";
  // .docx files are zip archives; the extension tells it apart from other zips.
  if (ascii(0, 4) === "PK\x03\x04" && /\.docx$/i.test(file.originalname)) return "docx";
  if (/\.(txt|md|markdown)$/i.test(file.originalname) && !b.includes(0)) return "text";
  return null;
}

export async function prepareNoteInput(files: UploadedFile[], pastedText: string | undefined): Promise<NoteInput> {
  if (files.length === 0) {
    return fromText("TEXT", pastedText ?? "");
  }
  if (pastedText?.trim()) {
    throw new HttpError(400, "Send either pasted text or files, not both.");
  }

  const total = files.reduce((sum, f) => sum + f.buffer.length, 0);
  if (total > MAX_TOTAL_BYTES) throw new HttpError(400, "Uploads are limited to 20 MB in total.");

  const kinds = files.map((f) => {
    const kind = sniff(f);
    if (kind === "heic") {
      throw new HttpError(400, `${f.originalname} is a HEIC photo. Please convert it to JPEG or PNG first.`);
    }
    if (!kind) {
      throw new HttpError(400, `${f.originalname} isn't a supported file. Use PDF, Word (.docx), .txt, .md, or JPEG/PNG/WebP/GIF images.`);
    }
    return kind;
  });

  // Several photos (pages of handwritten notes) are fine; documents come one at a time.
  if (kinds.every((k) => k.startsWith("image/"))) {
    return fromImages(files, kinds as Anthropic.Base64ImageSource["media_type"][]);
  }
  if (files.length > 1) {
    throw new HttpError(400, "Upload one document at a time, or up to 10 photos.");
  }

  const [file] = files;
  switch (kinds[0]) {
    case "pdf":
      return {
        sourceType: "PDF",
        rawText: null,
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.buffer.toString("base64") } },
          { type: "text", text: "Here are the student's notes as a PDF. Turn them into a study guide for their exam." },
        ],
      };
    case "docx": {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer }).catch(() => {
        throw new HttpError(400, "That Word document couldn't be opened. Is it a valid .docx file?");
      });
      return fromText("DOCX", value);
    }
    default:
      return fromText("TEXT", file.buffer.toString("utf8"));
  }
}

function fromText(sourceType: SourceType, text: string): NoteInput {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_CHARS) {
    throw new HttpError(400, `Notes need at least ${MIN_TEXT_CHARS} characters of text.`);
  }
  if (trimmed.length > MAX_TEXT_CHARS) {
    throw new HttpError(400, `Notes are limited to ${MAX_TEXT_CHARS.toLocaleString()} characters.`);
  }
  return {
    sourceType,
    rawText: trimmed,
    content: [
      {
        type: "text",
        // Tags mark where the student's notes start and end, so text inside them is
        // treated as material to summarize, never as instructions to follow.
        text: `<notes>\n${trimmed}\n</notes>\n\nTurn the notes above into a study guide for the student's exam.`,
      },
    ],
  };
}

function fromImages(files: UploadedFile[], mediaTypes: Anthropic.Base64ImageSource["media_type"][]): NoteInput {
  if (files.length > MAX_IMAGES) throw new HttpError(400, `Upload at most ${MAX_IMAGES} photos at a time.`);
  const tooBig = files.find((f) => f.buffer.length > MAX_IMAGE_BYTES);
  if (tooBig) throw new HttpError(400, `${tooBig.originalname} is larger than 7 MB. Please use a smaller photo.`);

  const content: Anthropic.ContentBlockParam[] = files.flatMap((f, i) => [
    { type: "text" as const, text: `Page ${i + 1}:` },
    { type: "image" as const, source: { type: "base64" as const, media_type: mediaTypes[i], data: f.buffer.toString("base64") } },
  ]);
  content.push({
    type: "text",
    text: "These are photos of the student's notes, in page order. Read them (including handwriting) and turn them into a study guide for their exam.",
  });
  return { sourceType: "IMAGE", rawText: null, content };
}
