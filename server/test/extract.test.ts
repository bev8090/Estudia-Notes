import { describe, expect, it } from "vitest";
import { HttpError } from "../src/lib/errors.ts";
import { prepareNoteInput, sniff } from "../src/services/extract.ts";

const file = (originalname: string, bytes: number[] | string) => ({
  originalname,
  buffer: typeof bytes === "string" ? Buffer.from(bytes, "latin1") : Buffer.from(bytes),
});

const longText = "Photosynthesis converts light energy into chemical energy stored in glucose. ".repeat(3);

describe("sniff", () => {
  it("identifies files by content, not by name", () => {
    expect(sniff(file("notes.txt", "%PDF-1.7 ..."))).toBe("pdf");
    expect(sniff(file("photo", [0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniff(file("x.png", [0x89, 0x50, 0x4e, 0x47]))).toBe("image/png");
    expect(sniff(file("x.webp", "RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniff(file("IMG_1.HEIC", "\0\0\0\x18ftypheic"))).toBe("heic");
    expect(sniff(file("notes.md", "# Heading"))).toBe("text");
    expect(sniff(file("program.exe", "MZ\x90\0"))).toBeNull();
    expect(sniff(file("fake.txt", [0x00, 0x01, 0x02]))).toBeNull(); // binary isn't text
  });
});

describe("prepareNoteInput", () => {
  it("wraps pasted text in <notes> tags", async () => {
    const input = await prepareNoteInput([], longText);
    expect(input.sourceType).toBe("TEXT");
    expect(input.rawText).toBe(longText.trim());
    expect(input.content[0]).toMatchObject({ type: "text" });
    expect((input.content[0] as { text: string }).text).toContain("<notes>");
  });

  it("rejects text that is too short", async () => {
    await expect(prepareNoteInput([], "too short")).rejects.toThrow(HttpError);
  });

  it("sends PDFs to Claude as a document block", async () => {
    const input = await prepareNoteInput([file("lecture.pdf", "%PDF-1.7 fake")], undefined);
    expect(input.sourceType).toBe("PDF");
    expect(input.content[0]).toMatchObject({ type: "document", source: { media_type: "application/pdf" } });
  });

  it("labels each photo with its page number", async () => {
    const jpeg = [0xff, 0xd8, 0xff, 0xe0];
    const input = await prepareNoteInput([file("a.jpg", jpeg), file("b.jpg", jpeg)], undefined);
    expect(input.sourceType).toBe("IMAGE");
    expect(input.content.filter((b) => b.type === "image")).toHaveLength(2);
    expect(input.content[2]).toMatchObject({ type: "text", text: "Page 2:" });
  });

  it("explains HEIC photos and mixed uploads instead of failing later", async () => {
    await expect(prepareNoteInput([file("IMG.HEIC", "\0\0\0\x18ftypheic")], undefined)).rejects.toThrow(/HEIC/);
    await expect(prepareNoteInput([file("a.pdf", "%PDF-1"), file("b.pdf", "%PDF-1")], undefined)).rejects.toThrow(/one document/);
    await expect(prepareNoteInput([file("a.pdf", "%PDF-1")], longText)).rejects.toThrow(/not both/);
  });
});
