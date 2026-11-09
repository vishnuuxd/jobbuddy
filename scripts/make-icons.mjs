// Draws the app icon: Meera's lavender body, plum eyes and the lime dot on plum.
// Shapes come from components/meera/Meera.tsx (240 grid, the "wide" eyes so they read at icon size).
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const PLUM = "#0b051d";
const LAVENDER = "#aa89f2";
const LIME = "#e6ffa9";
const BODY =
  "M115.7 18A112.3 92.4 0 0 1 228 110.4A99.4 117.6 0 0 1 128.6 228A116.6 100.8 0 0 1 12 127.2A103.7 109.2 0 0 1 115.7 18Z";

// Meera's box on the 240 grid, lime dot included: x 12–228, y 14–228.
const BOX = { x: 12, y: 14, w: 216, h: 214 };

/** `fill` is how much of the icon's width Meera takes. */
function svg(size, fill) {
  const scale = (size * fill) / BOX.w;
  const tx = (size - BOX.w * scale) / 2 - BOX.x * scale;
  const ty = (size - BOX.h * scale) / 2 - BOX.y * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${PLUM}"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <path d="${BODY}" fill="${LAVENDER}"/>
    <circle cx="208" cy="34" r="20" fill="${LIME}"/>
    <rect x="77.5" y="105" width="19" height="30" rx="9.5" fill="${PLUM}"/>
    <rect x="129.5" y="105" width="19" height="30" rx="9.5" fill="${PLUM}"/>
  </g>
</svg>`;
}

const out = "public/icons";
await mkdir(out, { recursive: true });
const icons = [
  ["icon-192.png", 192, 0.68],
  ["icon-512.png", 512, 0.68],
  // Maskable: keep Meera inside the 80% safe circle so any mask shape keeps her whole.
  ["icon-maskable-512.png", 512, 0.58],
  // iOS rounds the corners itself.
  ["apple-touch-icon.png", 180, 0.64],
];
for (const [name, size, fill] of icons) {
  await sharp(Buffer.from(svg(size, fill))).png().toFile(`${out}/${name}`);
  console.log(`${out}/${name}`);
}
