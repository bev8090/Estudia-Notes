import type Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { HttpError } from "../lib/errors.ts";
import { extractSlides, formatSlides } from "./pptx.ts";

export type SourceType = "TEXT" | "PDF" | "DOCX" | "PPTX" | "IMAGE";

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

// Upload limits. Signed-in users get the full limits; the free demo uses smaller ones
// so a visitor without an account can't run up a large AI bill.
export type UploadLimits = { maxTextChars: number; maxTotalBytes: number; maxImages: number };
export const FULL_LIMITS: UploadLimits = { maxTextChars: MAX_TEXT_CHARS, maxTotalBytes: MAX_TOTAL_BYTES, maxImages: MAX_IMAGES };
export const DEMO_LIMITS: UploadLimits = { maxTextChars: 20_000, maxTotalBytes: 5 * 1024 * 1024, maxImages: 3 };
const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

type Kind =
  | "pdf"
  | "docx"
  | "pptx"
  | "text"
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "heic"
  | "legacy-office";

// Pre-2007 Office files (.ppt, .doc) start with this signature (the OLE compound format).
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

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
  // .docx and .pptx files are zip archives; the extension tells them apart from other zips.
  if (ascii(0, 4) === "PK\x03\x04" && /\.docx$/i.test(file.originalname)) return "docx";
  if (ascii(0, 4) === "PK\x03\x04" && /\.pptx$/i.test(file.originalname)) return "pptx";
  if (b.subarray(0, 8).equals(OLE_SIGNATURE)) return "legacy-office";
  if (/\.(txt|md|markdown)$/i.test(file.originalname) && !b.includes(0)) return "text";
  return null;
}

export async function prepareNoteInput(
  files: UploadedFile[],
  pastedText: string | undefined,
  limits: UploadLimits = FULL_LIMITS,
): Promise<NoteInput> {
  if (files.length === 0) {
    return fromText("TEXT", pastedText ?? "", limits);
  }
  if (pastedText?.trim()) {
    throw new HttpError(400, "Send either pasted text or files, not both.");
  }

  const total = files.reduce((sum, f) => sum + f.buffer.length, 0);
  if (total > limits.maxTotalBytes) throw new HttpError(400, `Uploads are limited to ${mb(limits.maxTotalBytes)} in total.`);

  const kinds = files.map((f) => {
    const kind = sniff(f);
    if (kind === "heic") {
      throw new HttpError(400, `${f.originalname} is a HEIC photo. Please convert it to JPEG or PNG first.`);
    }
    if (kind === "legacy-office") {
      throw new HttpError(400, `${f.originalname} is an older Office file. Save it as .pptx, .docx or PDF and upload that.`);
    }
    if (!kind) {
      throw new HttpError(
        400,
        `${f.originalname} isn't a supported file. Use PDF, Word (.docx), PowerPoint (.pptx), .txt, .md, or JPEG/PNG/WebP/GIF images.`,
      );
    }
    return kind;
  });

  // Several photos (pages of handwritten notes) are fine; documents come one at a time.
  if (kinds.every((k) => k.startsWith("image/"))) {
    return fromImages(files, kinds as Anthropic.Base64ImageSource["media_type"][], limits);
  }
  if (files.length > 1) {
    throw new HttpError(400, `Upload one document at a time, or up to ${limits.maxImages} photos.`);
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
      return fromText("DOCX", value, limits);
    }
    case "pptx": {
      const slides = extractSlides(file.buffer);
      // Count only real slide text and notes, not the "Slide 1:" labels added for Claude.
      const contentChars = slides.reduce((sum, s) => sum + s.text.length + s.notes.length, 0);
      if (contentChars < MIN_TEXT_CHARS) {
        throw new HttpError(
          400,
          "We couldn't find enough text in these slides. If they're mostly pictures or diagrams, export them as a PDF (File > Export > PDF) and upload that instead.",
        );
      }
      return fromText("PPTX", formatSlides(slides), limits);
    }
    default:
      return fromText("TEXT", file.buffer.toString("utf8"), limits);
  }
}

function fromText(sourceType: SourceType, text: string, limits: UploadLimits): NoteInput {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_CHARS) {
    throw new HttpError(400, `Notes need at least ${MIN_TEXT_CHARS} characters of text.`);
  }
  if (trimmed.length > limits.maxTextChars) {
    throw new HttpError(400, `Notes are limited to ${limits.maxTextChars.toLocaleString()} characters.`);
  }
  return {
    sourceType,
    rawText: trimmed,
    content: [
      {
        type: "text",
        // Tags mark where the student's material starts and ends, so text inside them is
        // treated as material to summarize, never as instructions to follow.
        text:
          sourceType === "PPTX"
            ? `<slides>\n${trimmed}\n</slides>\n\nThese are the text and speaker notes from the student's lecture slides, slide by slide. Turn them into a study guide for the student's exam.`
            : `<notes>\n${trimmed}\n</notes>\n\nTurn the notes above into a study guide for the student's exam.`,
      },
    ],
  };
}

function fromImages(files: UploadedFile[], mediaTypes: Anthropic.Base64ImageSource["media_type"][], limits: UploadLimits): NoteInput {
  if (files.length > limits.maxImages) throw new HttpError(400, `Upload at most ${limits.maxImages} photos at a time.`);
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
