// Meera concept generator. Every expression is a set of rig values,
// the same controls the Rive file will expose.
const C = {
  halo: '#AA89F2', hair: '#5A3226', hairHi: '#8A5440', skin: '#C98463', skinShade: '#AE6C4D',
  blush: '#E8796B', line: '#2A1622', white: '#FFFFFF', iris: '#3B1F2E', mouth: '#4A1622',
  tongue: '#E7727F', lip: '#8E3F4A', blazer: '#FFA8CD', blazerShade: '#F089B5', shirt: '#FFFFFF',
  shirtShade: '#E9E4EE', hairDark: '#47261C', blazerFold: '#EE86B3', lime: '#E6FFA9', limeDark: '#B9D96A', note: '#FFFFFF', noteLine: '#D9D5E6', plum: '#0B051D'
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
  turn: 0,              // head turn -1..1 (about ±4°), faked with parallax
  sway: 0,              // hair lock swing in degrees (follow-through)
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
  const t = p.turn, sw = p.sway;
  // parallax: parts nearer the viewer slide further
  const fx = 5 * t, nx = 6.5 * t, hfx = 2 * t, hbx = -1.5 * t;
  const farL = t > 0 ? 1 - 0.24 * t : 1, farR = t < 0 ? 1 + 0.24 * t : 1;
  return `<g id="head" transform="rotate(${p.tilt} 200 300)">
  <g id="hair_back" transform="translate(${hbx} 0)">
    <g id="lock_L" transform="rotate(${sw} 128 236)"><path d="M108 210 C106 250 104 292 96 336 Q116 350 144 338 C148 300 150 280 156 262 L150 230 Z" fill="${C.hair}"/><path d="M118 262 C116 290 114 312 110 330" stroke="${C.hairDark}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/></g>
    <g id="lock_R" transform="rotate(${sw} 272 236)"><path d="M292 210 C294 250 296 292 304 336 Q284 350 256 338 C252 300 250 280 244 262 L250 230 Z" fill="${C.hair}"/><path d="M282 262 C284 290 286 312 290 330" stroke="${C.hairDark}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/></g>
    <path id="hair_crown" d="M106 214 C98 120 146 92 200 92 C254 92 302 120 294 214 L276 252 L124 252 Z" fill="${C.hair}"/>
  </g>
  <g id="ear_L" transform="translate(${-0.3 * t * 4} 0) translate(110 202) scale(${farL} 1) translate(-110 -202)"><ellipse cx="121" cy="202" rx="11" ry="15" fill="${C.skinShade}"/><path d="M118 196 Q124 202 119 210" stroke="#9A5B40" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="120" cy="222" r="5.5" fill="${C.lime}"/></g>
  <g id="ear_R" transform="translate(${-0.3 * t * 4} 0) translate(290 202) scale(${farR} 1) translate(-290 -202)"><ellipse cx="279" cy="202" rx="11" ry="15" fill="${C.skinShade}"/><path d="M282 196 Q276 202 281 210" stroke="#9A5B40" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="280" cy="222" r="5.5" fill="${C.lime}"/></g>
  <path id="face" transform="translate(${t} 0)" d="M200 104 C252 104 280 140 280 192 C280 246 246 284 200 284 C154 284 120 246 120 192 C120 140 148 104 200 104 Z" fill="${C.skin}"/>
  <g id="hair_front" transform="translate(${hfx} 0)">
    <defs><clipPath id="faceclip"><path d="M200 104 C252 104 280 140 280 192 C280 246 246 284 200 284 C154 284 120 246 120 192 C120 140 148 104 200 104 Z"/></clipPath></defs><g clip-path="url(#faceclip)"><path id="fringe_shadow" transform="translate(0 6)" d="M114 204 C106 136 148 100 204 100 C260 100 296 136 286 204 C282 176 274 156 262 142 C242 136 218 126 198 108 C186 126 166 134 146 138 C132 154 120 176 114 204 Z" fill="${C.skinShade}" opacity="0.45"/></g>
    <path d="M114 204 C106 136 148 100 204 100 C260 100 296 136 286 204 C282 176 274 156 262 142 C242 136 218 126 198 108 C186 126 166 134 146 138 C132 154 120 176 114 204 Z" fill="${C.hair}"/>
    <path d="M198 108 C186 126 168 132 150 136" stroke="${C.hairDark}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.55"/>
    <path d="M214 112 C232 126 250 134 266 140" stroke="${C.hairDark}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.55"/>
  </g>
  <g id="features" transform="translate(${fx} 0)">
    <ellipse cx="146" cy="232" rx="14" ry="8.5" fill="${C.blush}" opacity="${p.blush}"/>
    <ellipse cx="254" cy="232" rx="14" ry="8.5" fill="${C.blush}" opacity="${p.blush}"/>
    ${brow('L', p.browL)}${brow('R', p.browR)}
    ${eye('L', p.lidL, p.lowL, p.eyeL, p.look, p.pupil)}
    ${eye('R', p.lidR, p.lowR, p.eyeR, p.look, p.pupil)}
    <g id="mouth">${MOUTHS[p.mouth]()}</g>
  </g>
  <g id="nose" transform="translate(${nx} 0)">
    <path d="M203 206 Q206 220 204 226" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M193 228 Q200 233 207 228" stroke="${C.skinShade}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>
</g>`;
}

function body() {
  return `<g>
  <!-- neck -->
  <path d="M180 262 L220 262 L224 318 L176 318 Z" fill="${C.skin}"/>
  <path d="M180 270 Q200 286 220 270 L220 262 L180 262 Z" fill="${C.skinShade}"/>
  <!-- blazer -->
  <path d="M40 500 C46 372 90 330 150 314 L200 330 L250 314 C310 330 354 372 360 500 Z" fill="${C.blazer}"/>
  <path d="M70 420 C80 392 96 372 116 360" stroke="${C.blazerFold}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M330 420 C320 392 304 372 284 360" stroke="${C.blazerFold}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <!-- shirt -->
  <path d="M164 312 L200 336 L236 312 L232 500 L168 500 Z" fill="${C.shirt}"/>
  <path d="M164 312 L200 336 L184 352 L156 322 Z" fill="${C.shirtShade}"/>
  <path d="M236 312 L200 336 L216 352 L244 322 Z" fill="${C.shirtShade}"/>
  <!-- lapels -->
  <path d="M150 314 L182 360 L170 372 L178 500 L132 500 L128 360 Z" fill="${C.blazerShade}"/>
  <path d="M250 314 L218 360 L230 372 L222 500 L268 500 L272 360 Z" fill="${C.blazerShade}"/>
</g>`;
}

// Clipboard held tilted toward her, so we see its back. The pen hand works
// behind the board: only the knuckles and the top of the pen show over the edge.
// Writing slides the right arm along the board's top edge; the sleeve runs off-frame.
const ARM_PIVOT = [390, 540];
const PEN_TIP = [212, 412];
const KRAFT = '#C9955E', KRAFT_DARK = '#A9763F', CLIP = '#3B2433';
function props(w = {}) {
  const rot = w.rot ?? 0, dx = w.dx ?? 0, dy = w.dy ?? 0;
  return `<g>
  <!-- right arm, behind the board -->
  <g id="arm_R" opacity="${w.pose ? 0 : 1}" transform="translate(${dx} ${dy}) rotate(${rot} ${ARM_PIVOT[0]} ${ARM_PIVOT[1]})">
    <path id="sleeve_R" d="M470 560 C430 500 334 438 290 418 L270 446 C300 466 350 516 390 560 Z" fill="${C.blazerShade}"/>
    <path id="wrist_R" d="M270 446 L290 418 L258 380 L244 404 Z" fill="${C.skin}"/>
    <g id="watch"><path d="M262 438 L280 410 L290 416 L272 444 Z" fill="${C.plum}"/><circle cx="276" cy="427" r="7" fill="${C.lime}" stroke="${C.plum}" stroke-width="2.5"/></g>
    <g id="hand_R" transform="translate(6 -16)">
      <path id="pen_body" d="M${PEN_TIP[0]} ${PEN_TIP[1]} L258 344" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path id="pen_cap" d="M258 344 L252 353" stroke="${C.plum}" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path id="fist_R" d="M214 392 C214 376 228 370 242 374 C254 378 258 392 252 402 C246 410 232 412 222 408 C217 404 214 399 214 392 Z" fill="${C.skin}"/>
      <path d="M221 386 C227 380 237 380 243 384" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
    </g>
  </g>
  <!-- clipboard, back facing us -->
  <g id="clipboard" transform="rotate(-3 200 440)">
    <rect id="board" x="116" y="384" width="170" height="132" rx="10" fill="${KRAFT}"/>
    <rect x="116" y="384" width="170" height="132" rx="10" fill="none" stroke="${KRAFT_DARK}" stroke-width="3"/>
    <path d="M130 398 H272" stroke="#DDB07C" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <rect id="clip" x="176" y="374" width="50" height="16" rx="5" fill="${CLIP}"/>
    <circle cx="201" cy="380" r="3.5" fill="${C.lime}"/>
  </g>
  <!-- left hand holding the board's edge: palm beside it, fingers on the back -->
  <path id="palm_L" d="M120 422 C102 424 92 444 96 462 C100 476 114 480 124 472 Z" fill="${C.skin}"/>
  <g id="fingers_L" fill="${C.skin}">
    <rect x="114" y="428" width="28" height="11" rx="5.5"/>
    <rect x="114" y="441" width="30" height="11" rx="5.5"/>
    <rect x="114" y="454" width="28" height="11" rx="5.5"/>
    <rect x="114" y="467" width="24" height="10" rx="5"/>
  </g>
  <path d="M134 439 V441 M136 452 V454 M134 465 V467" stroke="${C.skinShade}" stroke-width="2" stroke-linecap="round"/>
  ${w.pose === 'watch' ? armWatch() : ''}${w.pose === 'hold' ? armHold() : ''}
</g>`;
}

// Watch check: forearm raised across the body above the board, watch face turned to the viewer.
function armWatch() {
  return `<g id="arm_watch" transform="translate(2 -22) rotate(-9 340 390)">
    <path id="sleeve_watch" d="M440 320 L440 452 L334 404 C320 396 316 368 326 354 Z" fill="${C.blazerShade}"/>
    <path d="M326 354 C316 368 320 396 334 404" stroke="${C.blazerFold}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path id="forearm_watch" d="M328 360 L246 350 C236 352 236 380 246 382 L330 398 Z" fill="${C.skin}"/>
    <path d="M300 392 L250 382" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
    <path id="pen_watch" d="M226 372 L198 410" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path id="fist_watch" d="M222 366 C222 352 236 346 248 350 C258 354 260 370 254 380 C248 388 234 390 228 384 C223 380 222 373 222 366 Z" fill="${C.skin}"/>
    <path d="M230 360 C236 356 244 356 250 360 M229 372 C235 368 243 368 249 372" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path id="strap_watch" d="M272 352 L290 355 L288 396 L270 392 Z" fill="${C.plum}"/>
    <circle id="watchface" cx="280" cy="373" r="13" fill="${C.lime}" stroke="${C.plum}" stroke-width="3.5"/>
    <path d="M280 373 V365 M280 373 L286 376" stroke="${C.plum}" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
}

// Hold on: forearm up beside the board, index finger raised, pen tucked in the fist.
function armHold() {
  return `<g id="arm_hold">
    <path id="sleeve_hold" d="M420 520 L330 520 L296 420 C300 404 326 398 340 410 Z" fill="${C.blazerShade}"/>
    <path id="forearm_hold" d="M300 418 L286 344 C296 336 314 338 318 346 L338 410 Z" fill="${C.skin}"/>
    <path id="pen_hold" d="M300 330 L338 300" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path id="pen_hold_cap" d="M338 300 L330 306" stroke="${C.plum}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path id="fist_hold" d="M280 330 C280 314 294 308 308 312 C320 316 322 332 316 342 C310 350 296 352 288 348 C283 344 280 338 280 330 Z" fill="${C.skin}"/>
    <rect id="index_hold" x="285" y="270" width="13" height="50" rx="6.5" fill="${C.skin}"/>
    <path d="M288 284 Q291 286 295 284" stroke="${C.skinShade}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M288 330 C294 326 304 326 310 330" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path id="strap_hold" d="M290 362 L314 358 L318 376 L294 380 Z" fill="${C.plum}"/>
  </g>`;
}

const TILE = '36 30 328 430';
function full(p, opts = {}) {
  p = merge(p);
  const vb = opts.viewBox ?? TILE;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${opts.w ?? 328}" height="${opts.h ?? 430}">
  <defs><radialGradient id="glow" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="#AA89F2" stop-opacity="0.42"/><stop offset="1" stop-color="#AA89F2" stop-opacity="0"/></radialGradient></defs>
  <rect x="0" y="0" width="400" height="520" fill="#140C2A"/>
  <ellipse cx="200" cy="220" rx="230" ry="240" fill="url(#glow)"/>
  ${body()}
  ${head(p)}
  ${opts.props === false ? '' : props(opts.write)}
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

module.exports = { C, full, ARM_PIVOT, PEN_TIP, TILE, portrait, mouthOnly, EXPRESSIONS, VISEMES, VISEME_HINT, merge };
