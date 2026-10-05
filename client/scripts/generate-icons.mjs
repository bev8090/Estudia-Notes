// Generates the PNG/ICO app icons from app/icon.svg (the single source of truth).
// Run after editing icon.svg:  npm run icons
//
// Outputs (Next.js picks these up automatically by file name):
//   app/favicon.ico     16, 32 and 48 px, for browser tabs and older browsers
//   app/apple-icon.png  180 px, used when the site is added to an iPhone home screen
// app/icon.svg itself is served as the sharp vector favicon for modern browsers.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const appDir = new URL("../app/", import.meta.url);
const svg = await readFile(new URL("icon.svg", appDir), "utf8");

// Render the 32x32 SVG at an exact pixel size.
const png = (source, size) =>
  sharp(Buffer.from(source), { density: (72 * size) / 32 })
    .resize(size, size)
    .png()
    .toBuffer();

// favicon.ico: an ICO container holding PNG images (supported by all current browsers).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => png(svg, size)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map((data, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(sizes[i], 0); // width
  entry.writeUInt8(sizes[i], 1); // height
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});
await writeFile(new URL("favicon.ico", appDir), Buffer.concat([header, ...entries, ...images]));

// apple-icon.png: iOS rounds the corners itself and expects no transparency, so use a
// square full-bleed background and shrink the glyph a little so it isn't cramped.
const appleSvg = svg
  .replace('rx="8"', 'rx="0"')
  .replace('<g id="glyph">', '<g id="glyph" transform="translate(16 16) scale(0.82) translate(-16 -16)">');
await writeFile(new URL("apple-icon.png", appDir), await png(appleSvg, 180));

console.log("Wrote app/favicon.ico (16, 32, 48 px) and app/apple-icon.png (180 px) from app/icon.svg");
