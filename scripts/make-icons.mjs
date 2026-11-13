// Builds the app icons from design/app-icon.png (the "J" mark, 1024 px, transparent rounded corners).
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "design/app-icon.png";
// The mark's own background, sampled from SRC. Fills the transparent corners where the icon must be full bleed.
const BG = "#0a051c";

const out = "public/icons";
await mkdir(out, { recursive: true });

// Full-bleed square: corners filled, so iOS and Android masks never show transparent edges.
const square = await sharp(SRC).flatten({ background: BG }).png().toBuffer();

/** `scale` shrinks the mark inside the square, padding with BG. */
async function make(name, size, { bleed, scale = 1 }) {
  const src = bleed ? square : SRC;
  const inner = Math.round(size * scale);
  const pad = Math.floor((size - inner) / 2);
  await sharp(src)
    .resize(inner, inner)
    .extend({ top: pad, left: pad, bottom: size - inner - pad, right: size - inner - pad, background: BG })
    .png()
    .toFile(`${out}/${name}`);
  console.log(`${out}/${name}`);
}

// "any" icons keep the rounded corners as drawn.
await make("icon-192.png", 192, { bleed: false });
await make("icon-512.png", 512, { bleed: false });
// Maskable: shrink so the dot stays inside the 80% safe circle.
await make("icon-maskable-512.png", 512, { bleed: true, scale: 0.84 });
// iOS rounds the corners itself, so it needs a full square.
await make("apple-touch-icon.png", 180, { bleed: true });
