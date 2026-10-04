import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { HttpError } from "../src/lib/errors.ts";
import { prepareNoteInput, sniff } from "../src/services/extract.ts";
import { extractSlides } from "../src/services/pptx.ts";

const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const para = (text: string) => `<a:p><a:r><a:rPr lang="en-US"/><a:t>${text}</a:t></a:r></a:p>`;
const slideNumberField = (n: number) => `<a:p><a:fld id="{X}" type="slidenum"><a:t>${n}</a:t></a:fld></a:p>`;
const slide = (body: string, hidden = false) =>
  `<p:sld ${NS}${hidden ? ' show="0"' : ""}><p:cSld><p:spTree><p:sp><p:txBody>${body}</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;

// A tiny but structurally real .pptx: slide2.xml is shown first, slide3.xml is hidden,
// and the first shown slide has speaker notes.
function buildDeck(slides: Record<string, string>, order = ["slide2", "slide1", "slide3"]) {
  const rels = order.map((name, i) => `<Relationship Id="rId${i + 2}" Type="${REL}/slide" Target="slides/${name}.xml"/>`).join("");
  return Buffer.from(
    zipSync({
      "[Content_Types].xml": strToU8("<Types/>"),
      "ppt/presentation.xml": strToU8(
        `<p:presentation ${NS}><p:sldIdLst>${order.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst></p:presentation>`,
      ),
      "ppt/_rels/presentation.xml.rels": strToU8(
        `<Relationships><Relationship Id="rId1" Type="${REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/>${rels}</Relationships>`,
      ),
      "ppt/slides/_rels/slide2.xml.rels": strToU8(
        `<Relationships><Relationship Id="rId2" Type="${REL}/notesSlide" Target="../notesSlides/notesSlide1.xml"/></Relationships>`,
      ),
      "ppt/notesSlides/notesSlide1.xml": strToU8(
        `<p:notes ${NS}><p:cSld><p:spTree><p:sp><p:txBody>${para("Chlorophyll absorbs red &amp; blue light.")}${slideNumberField(1)}</p:txBody></p:sp></p:spTree></p:cSld></p:notes>`,
      ),
      ...Object.fromEntries(Object.entries(slides).map(([name, xml]) => [`ppt/slides/${name}.xml`, strToU8(xml)])),
    }),
  );
}

const lectureDeck = () =>
  buildDeck({
    slide2: slide(para("Photosynthesis") + `<a:p><a:r><a:t>Light &amp; dark </a:t></a:r><a:r><a:t>reactions</a:t></a:r></a:p>` + slideNumberField(1)),
    slide1: slide(para("The Calvin cycle fixes CO2 into sugar using ATP and NADPH from the light reactions.")),
    slide3: slide(para("Secret draft slide"), true),
  });

describe("extractSlides", () => {
  it("follows presentation order, skips hidden slides, attaches notes and drops slide-number fields", () => {
    expect(extractSlides(lectureDeck())).toEqual([
      { number: 1, text: "Photosynthesis\nLight & dark reactions", notes: "Chlorophyll absorbs red & blue light." },
      { number: 2, text: "The Calvin cycle fixes CO2 into sugar using ATP and NADPH from the light reactions.", notes: "" },
    ]);
  });

  it("rejects files that aren't real presentations", () => {
    expect(() => extractSlides(Buffer.from("PK\x03\x04 not really a zip"))).toThrow(/couldn't be opened/);
  });

  it("rejects zip bombs before expanding them", () => {
    // ~60 MB of XML that compresses to a few KB.
    const bomb = buildDeck({ slide1: "<p:sld>" + " ".repeat(60 * 1024 * 1024) + "</p:sld>" }, ["slide1"]);
    expect(bomb.length).toBeLessThan(1024 * 1024);
    expect(() => extractSlides(bomb)).toThrow(/too large/);
  });
});

describe("PowerPoint uploads", () => {
  const file = (originalname: string, buffer: Buffer) => ({ originalname, buffer });

  it("are recognized by content plus extension", () => {
    expect(sniff(file("lecture.pptx", lectureDeck()))).toBe("pptx");
    expect(sniff(file("old.ppt", Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0])))).toBe("legacy-office");
  });

  it("become slide-labeled text for the study guide", async () => {
    const input = await prepareNoteInput([file("lecture.pptx", lectureDeck())], undefined);
    expect(input.sourceType).toBe("PPTX");
    const text = (input.content[0] as { text: string }).text;
    expect(text).toContain("<slides>");
    expect(text).toContain("Slide 1:\nPhotosynthesis");
    expect(text).toContain("Speaker notes:\nChlorophyll absorbs red & blue light.");
    expect(text).not.toContain("Secret draft slide");
  });

  it("explain image-only decks and old .ppt files", async () => {
    const pictures = buildDeck({ slide2: slide(""), slide1: slide(""), slide3: slide("") });
    await expect(prepareNoteInput([file("diagrams.pptx", pictures)], undefined)).rejects.toThrow(/export them as a PDF/);
    const legacy = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
    await expect(prepareNoteInput([file("old.ppt", legacy)], undefined)).rejects.toThrow(HttpError);
    await expect(prepareNoteInput([file("old.ppt", legacy)], undefined)).rejects.toThrow(/older Office file/);
  });
});
