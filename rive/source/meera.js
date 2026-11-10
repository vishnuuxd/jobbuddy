// Meera concept generator. Every expression is a set of rig values,
// the same controls the Rive file will expose.
const C = {
  halo: '#AA89F2', hair: '#3A2230', hairHi: '#5E3A4E', skin: '#C98463', skinShade: '#AE6C4D',
  blush: '#E8796B', line: '#2A1622', white: '#FFFFFF', iris: '#3B1F2E', mouth: '#4A1622',
  tongue: '#E7727F', lip: '#8E3F4A', blazer: '#FFA8CD', blazerShade: '#F089B5', shirt: '#FFFFFF',
  shirtShade: '#E9E4EE', lime: '#E6FFA9', limeDark: '#B9D96A', note: '#FFFFFF', noteLine: '#D9D5E6', plum: '#0B051D'
};

const EYE = { L: { cx: 165, cy: 198 }, R: { cx: 235, cy: 198 }, rx: 20, ry: 23 };
const BROW = { L: { x: 162, y: 160 }, R: { x: 238, y: 160 } };

const defaults = {
  tilt: 0,               // head tilt in degrees
  browL: { dy: 0, rot: 0, arch: 0 }, browR: { dy: 0, rot: 0, arch: 0 },
  // upper lid openness at inner and outer corner, 1 = lid fully up
  lidL: { inn: 0.92, out: 0.92 }, lidR: { inn: 0.92, out: 0.92 },
  lowL: 0, lowR: 0,      // lower lid raise 0..1 (cheek push)
  eyeL: 'open', eyeR: 'open', // open | happy | closed
  look: { x: 0, y: 0 }, pupil: 1,
  mouth: 'half', blush: 0.35,
};

function merge(p) {
  const o = JSON.parse(JSON.stringify(defaults));
  for (const k in p) o[k] = (typeof p[k] === 'object' && !Array.isArray(p[k])) ? { ...o[k], ...p[k] } : p[k];
  return o;
}

function brow(side, b) {
  const base = BROW[side];
  const sx = side === 'L' ? 1 : -1;
  const a = b.arch;
  // local: inner end at +x, outer end at -x
  const d = `M-23 3 Q-6 ${-9 - a} 23 -1 Q25 4 21 6 Q-4 ${-1 - a} -21 8 Q-26 7 -23 3 Z`;
  return `<path d="${d}" fill="${C.line}" transform="translate(${base.x} ${base.y + b.dy}) scale(${sx} 1) rotate(${-b.rot * 1})"/>`;
}

let uid = 0;
function eye(side, lid, low, mode, look, pupil) {
  const { cx, cy } = EYE[side];
  const { rx, ry } = EYE;
  const id = `e${side}${uid++}`;
  const dir = side === 'L' ? 1 : -1; // inner corner direction (+x for L)
  if (mode === 'happy') {
    return `<path d="M${cx - 16} ${cy + 6} Q${cx} ${cy - 16} ${cx + 16} ${cy + 6}" stroke="${C.line}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
  }
  if (mode === 'closed') {
    return `<path d="M${cx - 16} ${cy + 2} Q${cx} ${cy + 12} ${cx + 16} ${cy + 2}" stroke="${C.line}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  }
  const top = cy - ry, h = 2 * ry;
  const yIn = top + (1 - lid.inn) * h, yOut = top + (1 - lid.out) * h;
  const xIn = cx + dir * (rx + 6), xOut = cx - dir * (rx + 6);
  const yMid = (yIn + yOut) / 2 + 3;
  const lidPath = `M${xOut} ${top - 30} L${xOut} ${yOut} Q${cx} ${yMid} ${xIn} ${yIn} L${xIn} ${top - 30} Z`;
  const lashPath = `M${xOut} ${yOut} Q${cx} ${yMid} ${xIn} ${yIn}`;
  const yLow = cy + ry - low * h * 0.62;
  const lowPath = `M${cx - rx - 3} ${cy + ry + 30} L${cx - rx - 3} ${yLow + 4} Q${cx} ${yLow - 10 * low} ${cx + rx + 3} ${yLow + 4} L${cx + rx + 3} ${cy + ry + 30} Z`;
  const px = cx + look.x * 7, py = cy + 2 + look.y * 7;
  const pr = 12.5 * pupil;
  // outer lash flick
  const fx = cx - dir * (rx - 1);
  const flick = `<path d="M${fx} ${Math.max(yOut, top + 4) + 3} q${-dir * 5} -1 ${-dir * 8} -6" stroke="${C.line}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  return `<g>
  <defs><clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath><clipPath id="${id}b"><ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry + 4}"/></clipPath></defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.white}"/>
  <g clip-path="url(#${id})">
    <circle cx="${px}" cy="${py}" r="${pr}" fill="${C.iris}"/>
    <circle cx="${px - 4 * pupil}" cy="${py - 5 * pupil}" r="${4.2 * pupil}" fill="${C.white}"/>
    <circle cx="${px + 4.5 * pupil}" cy="${py + 4 * pupil}" r="${1.8 * pupil}" fill="${C.white}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.line}" stroke-width="6"/>
  </g>
  <g clip-path="url(#${id}b)">
    <path d="${lowPath}" fill="${C.skin}"/>
    ${low > 0.05 ? `<path d="M${cx - rx - 3} ${yLow + 4} Q${cx} ${yLow - 10 * low} ${cx + rx + 3} ${yLow + 4}" stroke="${C.line}" stroke-width="3" fill="none"/>` : ''}
    <path d="${lidPath}" fill="${C.skin}"/>
    <path d="${lashPath}" stroke="${C.line}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  </g>
  ${flick}
</g>`;
}

function openMouth(d, opts = {}) {
  const id = `m${uid++}`;
  const teethTop = opts.teethTop ?? true, teethBot = opts.teethBot ?? false, tongue = opts.tongue ?? true;
  const ty = opts.ty ?? 0, by = opts.by ?? 0;
  return `<g>
  <defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
  <path d="${d}" fill="${C.mouth}"/>
  <g clip-path="url(#${id})">
    ${opts.teethPath ? `<path d="${opts.teethPath}" fill="${C.white}"/>` : ''}
    ${teethTop && !opts.teethPath ? `<rect x="160" y="${226 + ty}" width="80" height="${18}" rx="5" fill="${C.white}"/>` : ''}
    ${teethBot ? `<rect x="160" y="${262 + by}" width="80" height="16" rx="5" fill="${C.white}"/>` : ''}
    ${opts.tongueEl ? `<ellipse cx="${opts.tongueEl.cx}" cy="${opts.tongueEl.cy}" rx="${opts.tongueEl.rx}" ry="${opts.tongueEl.ry}" fill="${C.tongue}"/>` : ''}
    ${tongue && !opts.tongueEl ? `<ellipse cx="${200 + (opts.tx ?? 0)}" cy="${(opts.tgy ?? 276)}" rx="${opts.trx ?? 17}" ry="13" fill="${C.tongue}"/>` : ''}
  </g>
  <path d="${d}" fill="none" stroke="${C.mouth}" stroke-width="3" stroke-linejoin="round"/>
</g>`;
}

const stroke = (d, w = 4.5) => `<path d="${d}" stroke="${C.mouth}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

const MOUTHS = {
  // expression mouths
  half: () => stroke('M184 244 Q200 254 217 242') + stroke('M217 242 q3 -1 4 -4', 3.5),
  smile: () => openMouth('M170 232 Q200 250 230 232 Q226 272 200 274 Q174 272 170 232 Z', { tgy: 276, teethPath: 'M166 228 Q200 248 234 228 L234 240 Q200 260 166 240 Z' }),
  laugh: () => openMouth('M179.769 238.25 Q200.315 247.884 220.861 238.25 Q219.652 269.559 200.315 270.763 Q180.978 269.559 179.769 238.25 Z', { teethPath: 'M179.684 240.853 Q199.688 249.816 219.692 240.853 L219.692 246.827 Q199.688 255.79 179.684 246.827 Z', tongueEl: { cx: 200.315, cy: 264.719, rx: 10.501, ry: 6.472 } }),
  flat: () => stroke('M184 251 Q199 250 213 245') + stroke('M213 245 q3 -1 5 -4', 3.5),
  soft: () => stroke('M188 248 Q200 253 212 248'),
  expect: () => stroke('M187 245 Q200 252 213 245'),
  oh: () => openMouth('M190 248 Q190 236 200 236 Q210 236 210 248 Q210 262 200 262 Q190 262 190 248 Z', { teethTop: false, tgy: 266, trx: 9 }),
  ooh: () => openMouth('M190 244 Q200 239 210 244 Q212 256 200 258 Q188 256 190 244 Z', { teethTop: false, tgy: 262, trx: 9 }),
  hmm: () => stroke('M190 249 Q200 247 208 246') + `<ellipse cx="213" cy="245.794" rx="6" ry="2.941" fill="${C.mouth}"/>`,
  // visemes
  v_rest: () => stroke('M186 245 Q200 252 214 244'),
  v_closed: () => `<path d="M184 245 Q200 249 216 245" stroke="${C.mouth}" stroke-width="6" stroke-linecap="round" fill="none"/>` + stroke('M190 251 Q200 254 210 251', 2.5),
  v_teeth: () => openMouth('M180 240 Q200 238 220 240 Q220 254 200 255 Q180 254 180 240 Z', { teethBot: true, tongue: false, ty: 10, by: -14 }),
  v_open: () => openMouth('M182 238 Q200 234 218 238 Q220 264 200 268 Q180 264 182 238 Z', { tgy: 270 }),
  v_wide: () => openMouth('M174 241 Q200 238 226 241 Q224 256 200 258 Q176 256 174 241 Z', { tgy: 262, ty: 10 }),
  v_round: () => openMouth('M188 246 Q188 234 200 234 Q212 234 212 246 Q212 260 200 260 Q188 260 188 246 Z', { teethTop: false, tgy: 264, trx: 10 }),
  v_pucker: () => openMouth('M193 247 Q193 240 200 240 Q207 240 207 247 Q207 254 200 254 Q193 254 193 247 Z', { teethTop: false, tongue: false }) + stroke('M190 243 q-2 4 0 8', 2.5) + stroke('M210 243 q2 4 0 8', 2.5),
  v_fv: () => openMouth('M182 242 Q200 239 218 242 Q216 254 200 255 Q184 254 182 242 Z', { tongue: false, ty: 12 }) + `<path d="M184 252 Q200 258 216 252" stroke="${C.lip}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  v_lth: () => openMouth('M182 239 C194 237 206 237 218 239 C218 251.667 212 259 200 261 C188 259 182 251.667 182 239 Z', { ty: 8, tongueEl: { cx: 200, cy: 255.555, rx: 11, ry: 9.444 } }),
};

function head(p) {
  const tilt = p.tilt;
  return `<g transform="rotate(${tilt} 200 300)">
  <!-- hair back + bun -->
  <circle cx="200" cy="80" r="33" fill="${C.hair}"/>
  <path d="M188 58 Q204 52 218 62" stroke="${C.hairHi}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M108 200 C100 128 146 94 200 94 C256 94 300 128 292 200 C290 232 282 252 268 262 L132 262 C118 252 110 232 108 200 Z" fill="${C.hair}"/>
  <!-- ears -->
  <ellipse cx="121" cy="202" rx="11" ry="15" fill="${C.skinShade}"/>
  <ellipse cx="279" cy="202" rx="11" ry="15" fill="${C.skinShade}"/>
  <circle cx="120" cy="222" r="5.5" fill="${C.lime}"/>
  <circle cx="280" cy="222" r="5.5" fill="${C.lime}"/>
  <!-- face -->
  <path d="M200 104 C252 104 280 140 280 192 C280 246 246 284 200 284 C154 284 120 246 120 192 C120 140 148 104 200 104 Z" fill="${C.skin}"/>
  <!-- blush -->
  <ellipse cx="146" cy="232" rx="14" ry="8.5" fill="${C.blush}" opacity="${p.blush}"/>
  <ellipse cx="254" cy="232" rx="14" ry="8.5" fill="${C.blush}" opacity="${p.blush}"/>
  <!-- hair front: side swept fringe -->
  <path d="M114 204 C106 136 148 100 204 100 C260 100 296 136 286 204 C282 176 274 156 262 142 C242 136 218 126 198 108 C186 126 166 134 146 138 C132 154 120 176 114 204 Z" fill="${C.hair}"/>
  <path d="M226 108 C244 112 260 122 270 136" stroke="${C.hairHi}" stroke-width="5" stroke-linecap="round" fill="none"/>
  ${brow('L', p.browL)}${brow('R', p.browR)}
  ${eye('L', p.lidL, p.lowL, p.eyeL, p.look, p.pupil)}
  ${eye('R', p.lidR, p.lowR, p.eyeR, p.look, p.pupil)}
  <!-- nose -->
  <path d="M203 206 Q206 220 204 226" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M193 228 Q200 233 207 228" stroke="${C.skinShade}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  ${MOUTHS[p.mouth]()}
</g>`;
}

function body() {
  return `<g>
  <!-- neck -->
  <path d="M180 262 L220 262 L224 318 L176 318 Z" fill="${C.skin}"/>
  <path d="M180 270 Q200 286 220 270 L220 262 L180 262 Z" fill="${C.skinShade}"/>
  <!-- blazer -->
  <path d="M56 440 C60 360 92 330 150 314 L200 330 L250 314 C308 330 340 360 344 440 Z" fill="${C.blazer}"/>
  <!-- shirt -->
  <path d="M164 312 L200 336 L236 312 L232 440 L168 440 Z" fill="${C.shirt}"/>
  <path d="M164 312 L200 336 L184 352 L156 322 Z" fill="${C.shirtShade}"/>
  <path d="M236 312 L200 336 L216 352 L244 322 Z" fill="${C.shirtShade}"/>
  <!-- lapels -->
  <path d="M150 314 L182 360 L170 372 L176 440 L136 440 L128 360 Z" fill="${C.blazerShade}"/>
  <path d="M250 314 L218 360 L230 372 L224 440 L264 440 L272 360 Z" fill="${C.blazerShade}"/>
</g>`;
}

function props() {
  return `<g>
  <!-- notepad -->
  <g transform="rotate(-8 130 400)">
    <rect x="84" y="366" width="96" height="74" rx="8" fill="${C.note}" stroke="#EEE9FF"/>
    <rect x="84" y="366" width="96" height="12" rx="6" fill="${C.limeDark}"/>
    <path d="M98 394 H164 M98 408 H156 M98 422 H140" stroke="${C.noteLine}" stroke-width="4" stroke-linecap="round"/>
  </g>
  <!-- sleeve, watch, hand, pen -->
  <path d="M344 440 C340 420 330 404 312 396 L286 416 C296 424 304 432 306 440 Z" fill="${C.blazerShade}"/>
  <path d="M286 416 L312 396 L304 388 L280 408 Z" fill="${C.skin}"/>
  <path d="M282 402 L304 384 L312 394 L290 412 Z" fill="${C.plum}"/>
  <circle cx="297" cy="398" r="7.5" fill="${C.lime}" stroke="${C.plum}" stroke-width="2.5"/>
  <path d="M300 336 L262 404" stroke="${C.lime}" stroke-width="7" stroke-linecap="round"/>
  <path d="M300 336 L295 345" stroke="${C.plum}" stroke-width="7" stroke-linecap="round"/>
  <path d="M262 372 C262 356 276 348 290 352 C302 356 306 370 300 382 C294 392 280 394 270 390 C264 386 262 380 262 372 Z" fill="${C.skin}"/>
  <path d="M268 366 C274 360 284 360 290 364" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M266 378 C272 374 282 374 288 378" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
</g>`;
}

function full(p, opts = {}) {
  p = merge(p);
  const halo = opts.halo ?? true;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="${opts.w ?? 400}" height="${opts.h ?? 440}">
  ${halo ? `<circle cx="200" cy="214" r="168" fill="${C.halo}"/>` : ''}
  ${body()}
  ${head(p)}
  ${opts.props === false ? '' : props()}
</svg>`;
}

function portrait(p, opts = {}) {
  p = merge(p);
  const halo = opts.halo ?? true;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 40 240 240" width="${opts.w ?? 160}" height="${opts.h ?? 160}">
  ${halo ? `<circle cx="200" cy="190" r="112" fill="${C.halo}"/>` : ''}
  ${body()}
  ${head(p)}
</svg>`;
}

function mouthOnly(key, opts = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="160 212 80 80" width="${opts.w ?? 72}" height="${opts.h ?? 72}">
  <rect x="160" y="212" width="80" height="80" fill="${C.skin}"/>
  ${MOUTHS[key]()}
</svg>`;
}

const EXPRESSIONS = [
  { name: 'Listening', vm: 'mood: listening, idle', p: { look: { x: 0, y: 0.1 } } },
  { name: 'Warm smile', vm: 'trigger: smile', p: { mouth: 'smile', lowL: 0.5, lowR: 0.5, lidL: { inn: 1, out: 1 }, lidR: { inn: 1, out: 1 }, browL: { dy: -7, arch: 4, rot: 3 }, browR: { dy: -7, arch: 4, rot: 3 }, blush: 0.6, tilt: -3 } },
  { name: 'Talking', vm: 'mood: talking', p: { mouth: 'v_open', browL: { dy: -2 }, browR: { dy: -2 }, lowL: 0.15, lowR: 0.15 } },
  { name: 'Expectant', vm: 'trigger: expectant', p: { mouth: 'expect', browL: { dy: -6, rot: 4 }, browR: { dy: -6, rot: 4 }, tilt: 6, pupil: 1.06, lidL: { inn: 1, out: 1 }, lidR: { inn: 1, out: 1 } } },
  { name: 'Interested', vm: 'trigger: browRaise, leanIn', p: { mouth: 'half', browL: { dy: -10, arch: 4 }, browR: { dy: -10, arch: 4 }, lidL: { inn: 1, out: 1 }, lidR: { inn: 1, out: 1 }, pupil: 1.1 } },
  { name: 'Skeptical', vm: 'mood: skeptical', p: { mouth: 'flat', browL: { dy: 4, rot: -8 }, browR: { dy: -10, rot: 6, arch: 5 }, lidL: { inn: 0.62, out: 0.58 }, lidR: { inn: 0.95, out: 0.95 }, lowL: 0.22, look: { x: 0.35, y: 0 }, tilt: -4 } },
  { name: 'Writing', vm: 'mood: writing, glanceDown', p: { mouth: 'soft', lidL: { inn: 0.5, out: 0.45 }, lidR: { inn: 0.5, out: 0.45 }, look: { x: -0.2, y: 0.9 }, browL: { dy: 2 }, browR: { dy: 2 }, tilt: 3 } },
  { name: 'Thinking', vm: 'mood: intake', p: { mouth: 'hmm', look: { x: 0.7, y: -0.8 }, browL: { dy: 0, rot: -2 }, browR: { dy: -9, rot: 4, arch: 3 }, lidL: { inn: 0.85, out: 0.85 }, tilt: 5 } },
  { name: 'Impressed', vm: 'trigger: browRaise + smile', p: { mouth: 'ooh', browL: { dy: -12, arch: 5 }, browR: { dy: -12, arch: 5 }, lidL: { inn: 1, out: 1 }, lidR: { inn: 1, out: 1 }, pupil: 1.12, blush: 0.55 } },
  { name: 'Laughing', vm: 'expression: small laugh', p: { mouth: 'laugh', eyeL: 'happy', eyeR: 'happy', browL: { dy: -6, arch: 4 }, browR: { dy: -6, arch: 4 }, blush: 0.75, tilt: -7 } },
  { name: 'Reassuring', vm: 'answer went off track', p: { mouth: 'expect', browL: { dy: -5, rot: 15, arch: -2 }, browR: { dy: -5, rot: 15, arch: -2 }, lidL: { inn: 0.95, out: 0.84 }, lidR: { inn: 0.95, out: 0.84 }, lowL: 0.35, lowR: 0.35, tilt: 5, blush: 0.5 } },
  { name: 'Surprised', vm: 'cut in, interruption', p: { mouth: 'oh', browL: { dy: -14, arch: 6 }, browR: { dy: -14, arch: 6 }, lidL: { inn: 1.08, out: 1.08 }, lidR: { inn: 1.08, out: 1.08 }, pupil: 0.82 } },
];

const VISEMES = ['rest', 'closed', 'teeth', 'open', 'wide', 'round', 'pucker', 'fv', 'lth'];
const VISEME_HINT = { rest: 'silence', closed: 'm b p', teeth: 's z t d', open: 'a', wide: 'e i', round: 'o', pucker: 'u w oo', fv: 'f v', lth: 'l th' };

module.exports = { C, full, portrait, mouthOnly, EXPRESSIONS, VISEMES, VISEME_HINT, merge };
