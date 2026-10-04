import { strFromU8, unzipSync } from "fflate";
import { HttpError } from "../lib/errors.ts";

// Claude reads PDFs and images directly but not PowerPoint, so .pptx files are turned
// into text here. A .pptx is a zip of XML files: ppt/presentation.xml lists the slides in
// order, each slide is ppt/slides/slideN.xml, and speaker notes live in ppt/notesSlides/.
// Pictures and diagrams on slides are not read; image-heavy decks should be exported to PDF.

export type Slide = { number: number; text: string; notes: string };

// Only the XML we need is unzipped, with a cap on its declared size, so a small file
// that expands to gigabytes (a "zip bomb") is rejected instead of exhausting memory.
const NEEDED = /^ppt\/(presentation\.xml|_rels\/presentation\.xml\.rels|slides\/slide\d+\.xml|slides\/_rels\/slide\d+\.xml\.rels|notesSlides\/notesSlide\d+\.xml)$/;
const MAX_UNZIPPED_BYTES = 50 * 1024 * 1024;

const unreadable = () => new HttpError(400, "That PowerPoint file couldn't be opened. Is it a valid .pptx file?");

export function extractSlides(buffer: Buffer): Slide[] {
  let total = 0;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(buffer), {
      filter: (file) => {
        if (!NEEDED.test(file.name)) return false;
        total += file.originalSize;
        if (total > MAX_UNZIPPED_BYTES) throw new HttpError(400, "That PowerPoint file is too large to read.");
        return true;
      },
    });
  } catch (err) {
    throw err instanceof HttpError ? err : unreadable();
  }
  const read = (path: string) => (files[path] ? strFromU8(files[path]) : null);

  const presentation = read("ppt/presentation.xml");
  const presentationRels = read("ppt/_rels/presentation.xml.rels");
  if (!presentation || !presentationRels) throw unreadable();

  // Slide order comes from presentation.xml, not from file names: after slides are
  // reordered in PowerPoint, slide3.xml can be shown first.
  const rels = relationships(presentationRels, "ppt/");
  const slidePaths = [...presentation.matchAll(/<p:sldId\b[^>]*?\br:id="([^"]+)"/g)]
    .map((m) => rels.get(m[1])?.target)
    .filter((path): path is string => Boolean(path));

  const slides: Slide[] = [];
  slidePaths.forEach((path, i) => {
    const xml = read(path);
    if (!xml || /<p:sld\b[^>]*\bshow="0"/.test(xml)) return; // missing or hidden slide
    const slideRels = read(path.replace(/slides\/(slide\d+\.xml)$/, "slides/_rels/$1.rels"));
    const notesPath = slideRels
      ? [...relationships(slideRels, "ppt/slides/").values()].find((r) => r.type.endsWith("/notesSlide"))?.target
      : undefined;
    const notesXml = notesPath ? read(notesPath) : null;
    // Numbered by position in the deck (hidden slides keep their number) so students can cross-reference.
    slides.push({ number: i + 1, text: xmlText(xml), notes: notesXml ? xmlText(notesXml) : "" });
  });
  return slides;
}

export function formatSlides(slides: Slide[]): string {
  return slides
    .filter((s) => s.text || s.notes)
    .map((s) => `Slide ${s.number}:\n${s.text}${s.notes ? `\nSpeaker notes:\n${s.notes}` : ""}`)
    .join("\n\n");
}

// Map relationship id -> { target path inside the zip, relationship type }.
function relationships(xml: string, baseDir: string) {
  const map = new Map<string, { target: string; type: string }>();
  for (const [tag] of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const attr = (name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const id = attr("Id");
    const target = attr("Target");
    if (!id || !target || attr("TargetMode") === "External") continue;
    map.set(id, { target: resolvePath(baseDir, target), type: attr("Type") ?? "" });
  }
  return map;
}

function resolvePath(baseDir: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = baseDir.split("/").filter(Boolean);
  for (const part of target.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

// Text of every paragraph (<a:p>), joining its text runs (<a:t>). Auto-filled fields such
// as slide numbers and dates (<a:fld>) are dropped so they don't read as content.
function xmlText(xml: string): string {
  const withoutFields = xml.replace(/<a:fld\b[\s\S]*?<\/a:fld>/g, "");
  const paragraphs = withoutFields.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) ?? [];
  return paragraphs
    .map((p) =>
      [...p.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
        .map((m) => decodeEntities(m[1]))
        .join("")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

function decodeEntities(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
