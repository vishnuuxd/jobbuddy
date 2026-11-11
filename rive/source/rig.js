// Builds Meera's rig parts (v2) from the approved concept (meera.js).
// Every moving part is a named group with a pivot. Expressions are expressed
// only as transforms, opacity, pose swaps and one brow shape blend, the way Rive will play them.
// v2: video call tile framing, long hair with swinging locks, parallax head turn,
// clipboard held toward her, and three arm poses.
const m = require('./meera.js');
const { C } = m;
const fs = require('fs');

// The drawing lives in its own coordinates; the artboard shows the tile crop.
const TILE = { x: 36, y: 30, w: 328, h: 430 };
const EYE = { L: { cx: 165, cy: 198 }, R: { cx: 235, cy: 198 }, rx: 20, ry: 23 };
const BROW = { L: { x: 162, y: 160 }, R: { x: 238, y: 160 } };
const H = 2 * EYE.ry;
const NEUTRAL_LID = 0.92;
const ARCH_MIN = -3, ARCH_MAX = 6;
// Parallax rates for the head turn, in px per unit of turn (turn is -1..1, about ±4°).
const PARALLAX = { features: 5, nose: 6.5, face: 1, hair_front: 2, hair_back: -1.5, ears: -1.2, farEar: 0.24 };
const KRAFT = '#C9955E', KRAFT_DARK = '#A9763F', CLIP = '#3B2433';
const FACE_PATH = 'M200 104 C252 104 280 140 280 192 C280 246 246 284 200 284 C154 284 120 246 120 192 C120 140 148 104 200 104 Z';
const FRINGE_PATH = 'M114 204 C106 136 148 100 204 100 C260 100 296 136 286 204 C282 176 274 156 262 142 C242 136 218 126 198 108 C186 126 166 134 146 138 C132 154 120 176 114 204 Z';

const r2 = (n) => Math.round(n * 100) / 100;
const browPath = (a) => `M-23 3 Q-6 ${r2(-9 - a)} 23 -1 Q25 4 21 6 Q-4 ${r2(-1 - a)} -21 8 Q-26 7 -23 3 Z`;

function lidGeom(side) {
  const { cx, cy } = EYE[side];
  const { rx, ry } = EYE;
  const dir = side === 'L' ? 1 : -1;
  const top = cy - ry;
  const y = top + (1 - NEUTRAL_LID) * H;
  return { cx, cy, rx, ry, dir, top, y, xIn: cx + dir * (rx + 6), xOut: cx - dir * (rx + 6) };
}

function eyePart(side) {
  const { cx, cy, rx, ry, dir, top, y, xIn, xOut } = lidGeom(side);
  const lid = `M${xOut} ${r2(y - 70)} L${xOut} ${r2(y)} Q${cx} ${r2(y + 3)} ${xIn} ${r2(y)} L${xIn} ${r2(y - 70)} Z`;
  const lash = `M${xOut} ${r2(y)} Q${cx} ${r2(y + 3)} ${xIn} ${r2(y)}`;
  const yLow = cy + ry;
  const low = `M${cx - rx - 3} ${yLow + 34} L${cx - rx - 3} ${yLow + 4} Q${cx} ${yLow - 2} ${cx + rx + 3} ${yLow + 4} L${cx + rx + 3} ${yLow + 34} Z`;
  const lowLine = `M${cx - rx - 3} ${yLow + 4} Q${cx} ${yLow - 2} ${cx + rx + 3} ${yLow + 4}`;
  const fx = cx - dir * (rx - 1);
  const fy = Math.max(y, top + 4) + 3;
  const s = side;
  return `
        <g id="eye_${s}" data-pivot="${cx} ${cy}">
          <defs>
            <clipPath id="clip_eye_${s}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
            <clipPath id="clip_lids_${s}"><ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry + 4}"/></clipPath>
          </defs>
          <g id="eye_open_${s}" {{eye_open_${s}}}>
            <ellipse id="eye_white_${s}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.white}"/>
            <g clip-path="url(#clip_eye_${s})">
              <g id="pupil_${s}" data-pivot="${cx} ${cy + 2}" {{pupil_${s}}}>
                <circle id="iris_${s}" cx="${cx}" cy="${cy + 2}" r="12.5" fill="${C.iris}"/>
                <circle id="shine_big_${s}" cx="${cx - 4}" cy="${cy - 3}" r="4.2" fill="${C.white}"/>
                <circle id="shine_small_${s}" cx="${cx + 4.5}" cy="${cy + 6}" r="1.8" fill="${C.white}"/>
              </g>
              <ellipse id="eye_ring_${s}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.line}" stroke-width="6"/>
            </g>
            <g clip-path="url(#clip_lids_${s})">
              <g id="lid_lower_${s}" data-pivot="${cx} ${yLow}" {{lid_lower_${s}}}>
                <path id="lid_lower_skin_${s}" d="${low}" fill="${C.skin}"/>
                <path id="lid_lower_line_${s}" d="${lowLine}" stroke="${C.line}" stroke-width="3" fill="none" {{lid_lower_line_${s}}}/>
              </g>
              <g id="lid_upper_${s}" data-pivot="${cx} ${r2(y)}" {{lid_upper_${s}}}>
                <path id="lid_upper_skin_${s}" d="${lid}" fill="${C.skin}"/>
                <path id="lash_${s}" d="${lash}" stroke="${C.line}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
              </g>
            </g>
            <path id="lash_flick_${s}" d="M${fx} ${r2(fy)} q${-dir * 5} -1 ${-dir * 8} -6" stroke="${C.line}" stroke-width="4" stroke-linecap="round" fill="none" {{lash_flick_${s}}}/>
          </g>
          <path id="eye_happy_${s}" d="M${cx - 16} ${cy + 6} Q${cx} ${cy - 16} ${cx + 16} ${cy + 6}" stroke="${C.line}" stroke-width="5.5" stroke-linecap="round" fill="none" {{eye_happy_${s}}}/>
          <path id="eye_closed_${s}" d="M${cx - 16} ${cy + 2} Q${cx} ${cy + 12} ${cx + 16} ${cy + 2}" stroke="${C.line}" stroke-width="5" stroke-linecap="round" fill="none" {{eye_closed_${s}}}/>
        </g>`;
}

const MOUTH_KEYS = {
  mouth_neutral: 'half', mouth_smile: 'smile', mouth_laugh: 'laugh', mouth_flat: 'flat', mouth_soft: 'soft',
  mouth_expect: 'expect', mouth_oh: 'oh', mouth_ooh: 'ooh', mouth_hmm: 'hmm',
};
for (const v of m.VISEMES) MOUTH_KEYS[`viseme_${v}`] = `v_${v}`;

function mouthPart(name, key) {
  let svg = m.mouthOnly(key).replace(/^[\s\S]*?<rect[^>]*\/>/, '').replace(/<\/svg>\s*$/, '');
  let n = 0;
  svg = svg.replace(/id="m\d+"/g, () => `id="clip_${name}${n++ ? '_' + n : ''}"`);
  n = 0;
  svg = svg.replace(/url\(#m\d+\)/g, () => `url(#clip_${name}${n++ ? '_' + n : ''})`);
  return `<g id="${name}" {{${name}}}>${svg.trim()}</g>`;
}

const strand = (id, d, op = 0.6) => `<path id="${id}" d="${d}" stroke="${C.hairDark}" stroke-width="3" stroke-linecap="round" fill="none" opacity="${op}"/>`;

function partsSvg() {
  const brow = (s) => {
    const b = BROW[s];
    return `<g id="brow_${s}" data-pivot="${b.x} ${b.y}" {{brow_${s}}}><path id="brow_shape_${s}" d="{{brow_shape_${s}}}" fill="${C.line}" transform="scale(${s === 'L' ? 1 : -1} 1)"/></g>`;
  };
  const mouths = Object.entries(MOUTH_KEYS).map(([n, k]) => mouthPart(n, k)).join('\n          ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE.w} ${TILE.h}" width="${TILE.w}" height="${TILE.h}">
  <defs>
    <radialGradient id="glow_gradient" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="#AA89F2" stop-opacity="0.42"/><stop offset="1" stop-color="#AA89F2" stop-opacity="0"/></radialGradient>
  </defs>
  <g id="meera" transform="translate(${-TILE.x} ${-TILE.y})">
    <g id="bg">
      <rect id="bg_fill" x="0" y="0" width="400" height="520" fill="#140C2A"/>
      <ellipse id="glow" cx="200" cy="220" rx="230" ry="240" fill="url(#glow_gradient)"/>
    </g>
    <g id="body" data-pivot="200 520" {{body}}>
      <path id="neck" d="M180 262 L220 262 L224 318 L176 318 Z" fill="${C.skin}"/>
      <path id="neck_shadow" d="M180 270 Q200 286 220 270 L220 262 L180 262 Z" fill="${C.skinShade}"/>
      <path id="blazer" d="M40 500 C46 372 90 330 150 314 L200 330 L250 314 C310 330 354 372 360 500 Z" fill="${C.blazer}"/>
      <path id="blazer_fold_L" d="M70 420 C80 392 96 372 116 360" stroke="${C.blazerFold}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path id="blazer_fold_R" d="M330 420 C320 392 304 372 284 360" stroke="${C.blazerFold}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path id="shirt" d="M164 312 L200 336 L236 312 L232 500 L168 500 Z" fill="${C.shirt}"/>
      <path id="collar_L" d="M164 312 L200 336 L184 352 L156 322 Z" fill="${C.shirtShade}"/>
      <path id="collar_R" d="M236 312 L200 336 L216 352 L244 322 Z" fill="${C.shirtShade}"/>
      <path id="lapel_L" d="M150 314 L182 360 L170 372 L178 500 L132 500 L128 360 Z" fill="${C.blazerShade}"/>
      <path id="lapel_R" d="M250 314 L218 360 L230 372 L222 500 L268 500 L272 360 Z" fill="${C.blazerShade}"/>
    </g>
    <g id="head" data-pivot="200 300" {{head}}>
      <g id="hair_back" data-pivot="200 250" {{hair_back}}>
        <g id="lock_L" data-pivot="128 236" {{lock_L}}>
          <path id="lock_L_shape" d="M108 210 C106 250 104 292 96 336 Q116 350 144 338 C148 300 150 280 156 262 L150 230 Z" fill="${C.hair}"/>
          ${strand('lock_L_strand', 'M118 262 C116 290 114 312 110 330')}
        </g>
        <g id="lock_R" data-pivot="272 236" {{lock_R}}>
          <path id="lock_R_shape" d="M292 210 C294 250 296 292 304 336 Q284 350 256 338 C252 300 250 280 244 262 L250 230 Z" fill="${C.hair}"/>
          ${strand('lock_R_strand', 'M282 262 C284 290 286 312 290 330')}
        </g>
        <path id="hair_crown" d="M106 214 C98 120 146 92 200 92 C254 92 302 120 294 214 L276 252 L124 252 Z" fill="${C.hair}"/>
      </g>
      <g id="ear_L" data-pivot="110 202" {{ear_L}}>
        <ellipse id="ear_L_shape" cx="121" cy="202" rx="11" ry="15" fill="${C.skinShade}"/>
        <path id="ear_L_inner" d="M118 196 Q124 202 119 210" stroke="#9A5B40" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle id="earring_L" cx="120" cy="222" r="5.5" fill="${C.lime}"/>
      </g>
      <g id="ear_R" data-pivot="290 202" {{ear_R}}>
        <ellipse id="ear_R_shape" cx="279" cy="202" rx="11" ry="15" fill="${C.skinShade}"/>
        <path id="ear_R_inner" d="M282 196 Q276 202 281 210" stroke="#9A5B40" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle id="earring_R" cx="280" cy="222" r="5.5" fill="${C.lime}"/>
      </g>
      <path id="face" d="${FACE_PATH}" fill="${C.skin}" {{face}}/>
      <g id="hair_front" {{hair_front}}>
        <defs><clipPath id="clip_face"><path d="${FACE_PATH}"/></clipPath></defs>
        <g clip-path="url(#clip_face)"><path id="fringe_shadow" transform="translate(0 6)" d="${FRINGE_PATH}" fill="${C.skinShade}" opacity="0.45"/></g>
        <path id="fringe" d="${FRINGE_PATH}" fill="${C.hair}"/>
        ${strand('fringe_strand_L', 'M198 108 C186 126 168 132 150 136', 0.55)}
        ${strand('fringe_strand_R', 'M214 112 C232 126 250 134 266 140', 0.55)}
      </g>
      <g id="features" {{features}}>
        <ellipse id="blush_L" cx="146" cy="232" rx="14" ry="8.5" fill="${C.blush}" {{blush}}/>
        <ellipse id="blush_R" cx="254" cy="232" rx="14" ry="8.5" fill="${C.blush}" {{blush}}/>
        ${brow('L')}
        ${brow('R')}
        ${eyePart('L')}
        ${eyePart('R')}
        <g id="mouth" data-pivot="200 248" {{mouth}}>
          ${mouths}
        </g>
      </g>
      <g id="nose" {{nose}}>
        <path id="nose_bridge" d="M203 206 Q206 220 204 226" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path id="nose_tip" d="M193 228 Q200 233 207 228" stroke="${C.skinShade}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      </g>
    </g>
    <g id="arm_R" data-pivot="390 540" {{arm_R}}>
      <path id="sleeve_R" d="M470 560 C430 500 334 438 290 418 L270 446 C300 466 350 516 390 560 Z" fill="${C.blazerShade}"/>
      <path id="wrist_R" d="M270 446 L290 418 L258 380 L244 404 Z" fill="${C.skin}"/>
      <g id="watch">
        <path id="watch_strap" d="M262 438 L280 410 L290 416 L272 444 Z" fill="${C.plum}"/>
        <circle id="watch_face" cx="276" cy="427" r="7" fill="${C.lime}" stroke="${C.plum}" stroke-width="2.5"/>
      </g>
      <g id="hand_R" transform="translate(6 -16)">
        <path id="pen_body" d="M212 412 L258 344" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path id="pen_cap" d="M258 344 L252 353" stroke="${C.plum}" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path id="fist_R" d="M214 392 C214 376 228 370 242 374 C254 378 258 392 252 402 C246 410 232 412 222 408 C217 404 214 399 214 392 Z" fill="${C.skin}"/>
        <path id="knuckle_R" d="M221 386 C227 380 237 380 243 384" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>
    </g>
    <g id="clipboard" data-pivot="200 440" transform="rotate(-3 200 440)">
      <rect id="board" x="116" y="384" width="170" height="132" rx="10" fill="${KRAFT}"/>
      <rect id="board_edge" x="116" y="384" width="170" height="132" rx="10" fill="none" stroke="${KRAFT_DARK}" stroke-width="3"/>
      <path id="board_shine" d="M130 398 H272" stroke="#DDB07C" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>
      <rect id="clip" x="176" y="374" width="50" height="16" rx="5" fill="${CLIP}"/>
      <circle id="clip_dot" cx="201" cy="380" r="3.5" fill="${C.lime}"/>
    </g>
    <g id="hand_L">
      <path id="palm_L" d="M120 422 C102 424 92 444 96 462 C100 476 114 480 124 472 Z" fill="${C.skin}"/>
      <g id="fingers_L" fill="${C.skin}">
        <rect x="114" y="428" width="28" height="11" rx="5.5"/>
        <rect x="114" y="441" width="30" height="11" rx="5.5"/>
        <rect x="114" y="454" width="28" height="11" rx="5.5"/>
        <rect x="114" y="467" width="24" height="10" rx="5"/>
      </g>
      <path id="finger_lines_L" d="M134 439 V441 M136 452 V454 M134 465 V467" stroke="${C.skinShade}" stroke-width="2" stroke-linecap="round" fill="none"/>
    </g>
    <g id="arm_watch" data-pivot="340 390" {{arm_watch}}>
      <g transform="translate(2 -22) rotate(-9 340 390)">
        <path id="sleeve_watch" d="M440 320 L440 452 L334 404 C320 396 316 368 326 354 Z" fill="${C.blazerShade}"/>
        <path id="sleeve_watch_fold" d="M326 354 C316 368 320 396 334 404" stroke="${C.blazerFold}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path id="forearm_watch" d="M328 360 L246 350 C236 352 236 380 246 382 L330 398 Z" fill="${C.skin}"/>
        <path id="forearm_watch_line" d="M300 392 L250 382" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
        <path id="pen_watch" d="M226 372 L198 410" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path id="fist_watch" d="M222 366 C222 352 236 346 248 350 C258 354 260 370 254 380 C248 388 234 390 228 384 C223 380 222 373 222 366 Z" fill="${C.skin}"/>
        <path id="knuckles_watch" d="M230 360 C236 356 244 356 250 360 M229 372 C235 368 243 368 249 372" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path id="strap_watch" d="M272 352 L290 355 L288 396 L270 392 Z" fill="${C.plum}"/>
        <circle id="watchface_big" cx="280" cy="373" r="13" fill="${C.lime}" stroke="${C.plum}" stroke-width="3.5"/>
        <path id="watch_hands" d="M280 373 V365 M280 373 L286 376" stroke="${C.plum}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </g>
    </g>
    <g id="arm_hold" data-pivot="320 420" {{arm_hold}}>
      <path id="sleeve_hold" d="M420 520 L330 520 L296 420 C300 404 326 398 340 410 Z" fill="${C.blazerShade}"/>
      <path id="forearm_hold" d="M300 418 L286 344 C296 336 314 338 318 346 L338 410 Z" fill="${C.skin}"/>
      <path id="pen_hold" d="M300 330 L338 300" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path id="pen_hold_cap" d="M338 300 L330 306" stroke="${C.plum}" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path id="fist_hold" d="M280 330 C280 314 294 308 308 312 C320 316 322 332 316 342 C310 350 296 352 288 348 C283 344 280 338 280 330 Z" fill="${C.skin}"/>
      <rect id="index_hold" x="285" y="270" width="13" height="50" rx="6.5" fill="${C.skin}"/>
      <path id="index_crease" d="M288 284 Q291 286 295 284" stroke="${C.skinShade}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path id="knuckle_hold" d="M288 330 C294 326 304 326 310 330" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path id="strap_hold" d="M290 362 L314 358 L318 376 L294 380 Z" fill="${C.plum}"/>
    </g>
  </g>
</svg>`;
}

// ---------- expression values -> rig values ----------
function rigValues(p, mouthName, arm = { pose: 'rest' }) {
  p = m.merge(p);
  const t = p.turn;
  const v = {
    head: { rot: p.tilt }, blush: { opacity: p.blush }, mouth: mouthName,
    turn: t,
    features: { tx: r2(PARALLAX.features * t) }, nose: { tx: r2(PARALLAX.nose * t) }, face: { tx: r2(PARALLAX.face * t) },
    hair_front: { tx: r2(PARALLAX.hair_front * t) }, hair_back: { tx: r2(PARALLAX.hair_back * t) },
    ear_L: { tx: r2(PARALLAX.ears * t), sx: t > 0 ? r2(1 - PARALLAX.farEar * t) : 1 },
    ear_R: { tx: r2(PARALLAX.ears * t), sx: t < 0 ? r2(1 + PARALLAX.farEar * t) : 1 },
    lock_L: { rot: p.sway }, lock_R: { rot: p.sway },
    arm: { pose: arm.pose ?? 'rest', tx: arm.dx ?? 0, ty: arm.dy ?? 0 },
  };
  for (const s of ['L', 'R']) {
    const b = s === 'L' ? p.browL : p.browR;
    v[`brow_${s}`] = { ty: b.dy, rot: s === 'L' ? -b.rot : b.rot, arch: r2((b.arch - ARCH_MIN) / (ARCH_MAX - ARCH_MIN)) };
    const lid = s === 'L' ? p.lidL : p.lidR;
    const g = lidGeom(s);
    const yIn = g.top + (1 - lid.inn) * H, yOut = g.top + (1 - lid.out) * H;
    let ang = (Math.atan2(yIn - yOut, g.xIn - g.xOut) - Math.atan2(0, g.xIn - g.xOut)) * 180 / Math.PI;
    // Keep the tilt in -180..180, so Rive animates the short way round and the lid never spins.
    ang = ((ang + 540) % 360) - 180;
    v[`lid_upper_${s}`] = { ty: r2((yIn + yOut) / 2 - g.y), rot: r2(ang) };
    const low = s === 'L' ? p.lowL : p.lowR;
    v[`lid_lower_${s}`] = { ty: r2(-low * H * 0.62), line: low > 0.05 ? 1 : 0 };
    v[`lash_flick_${s}`] = { ty: r2(Math.max(yOut, g.top + 4) - Math.max(g.y, g.top + 4)) };
    v[`pupil_${s}`] = { tx: r2(p.look.x * 7), ty: r2(p.look.y * 7), scale: p.pupil };
    v[`eye_${s}`] = (s === 'L' ? p.eyeL : p.eyeR);
  }
  return v;
}

// Applies rig values as transforms only, to check a transform rig reproduces the concept.
function pose(v) {
  const t = {};
  const rotAt = (rot, x, y) => `rotate(${rot} ${x} ${y})`;
  const scaleXAt = (sx, x, y) => `translate(${x} ${y}) scale(${sx} 1) translate(${-x} ${-y})`;
  t.head = `transform="${rotAt(v.head.rot, 200, 300)}"`;
  t.blush = `opacity="${v.blush.opacity}"`;
  t.body = ''; t.mouth = '';
  t.features = `transform="translate(${v.features.tx} 0)"`;
  t.nose = `transform="translate(${v.nose.tx} 0)"`;
  t.face = `transform="translate(${v.face.tx} 0)"`;
  t.hair_front = `transform="translate(${v.hair_front.tx} 0)"`;
  t.hair_back = `transform="translate(${v.hair_back.tx} 0)"`;
  t.ear_L = `transform="translate(${v.ear_L.tx} 0) ${scaleXAt(v.ear_L.sx, 110, 202)}"`;
  t.ear_R = `transform="translate(${v.ear_R.tx} 0) ${scaleXAt(v.ear_R.sx, 290, 202)}"`;
  t.lock_L = `transform="${rotAt(v.lock_L.rot, 128, 236)}"`;
  t.lock_R = `transform="${rotAt(v.lock_R.rot, 272, 236)}"`;
  const a = v.arm;
  t.arm_R = a.pose === 'rest' || a.pose === 'writing' ? `transform="translate(${a.tx} ${a.ty})"` : 'opacity="0"';
  t.arm_watch = `opacity="${a.pose === 'watch' ? 1 : 0}"`;
  t.arm_hold = `opacity="${a.pose === 'hold' ? 1 : 0}"`;
  for (const s of ['L', 'R']) {
    const b = BROW[s], bv = v[`brow_${s}`];
    t[`brow_${s}`] = `transform="translate(${b.x} ${b.y + bv.ty}) rotate(${bv.rot})"`;
    t[`brow_shape_${s}`] = browPath(ARCH_MIN + bv.arch * (ARCH_MAX - ARCH_MIN));
    const g = lidGeom(s), lu = v[`lid_upper_${s}`];
    t[`lid_upper_${s}`] = `transform="translate(0 ${lu.ty}) ${rotAt(lu.rot, g.cx, g.y)}"`;
    const ll = v[`lid_lower_${s}`];
    t[`lid_lower_${s}`] = `transform="translate(0 ${ll.ty})"`;
    t[`lid_lower_line_${s}`] = `opacity="${ll.line}"`;
    t[`lash_flick_${s}`] = `transform="translate(0 ${v[`lash_flick_${s}`].ty})"`;
    const pv = v[`pupil_${s}`], px = g.cx, py = g.cy + 2;
    t[`pupil_${s}`] = `transform="translate(${pv.tx} ${pv.ty}) translate(${px} ${py}) scale(${pv.scale}) translate(${-px} ${-py})"`;
    const mode = v[`eye_${s}`];
    t[`eye_open_${s}`] = `opacity="${mode === 'open' ? 1 : 0}"`;
    t[`eye_happy_${s}`] = `opacity="${mode === 'happy' ? 1 : 0}"`;
    t[`eye_closed_${s}`] = `opacity="${mode === 'closed' ? 1 : 0}"`;
  }
  for (const n of Object.keys(MOUTH_KEYS)) t[n] = `opacity="${n === v.mouth ? 1 : 0}"`;
  return partsSvg().replace(/\{\{([\w]+)\}\}/g, (_, k) => t[k] ?? '');
}

// ---------- the approved v2 poses ----------
const TURN = { Listening: 0.6, Talking: 0.15, Expectant: -0.25, Skeptical: 0.35, Writing: -0.15, Thinking: 0.9, Laughing: -0.2, Reassuring: -0.3 };
const SWAY = { Laughing: 2.5, Expectant: -1.5 };
const ARM = { Writing: { pose: 'writing', dx: -20, dy: -6 } };
const MOUTH_FOR = { half: 'mouth_neutral', smile: 'mouth_smile', laugh: 'mouth_laugh', flat: 'mouth_flat', soft: 'mouth_soft', expect: 'mouth_expect', oh: 'mouth_oh', ooh: 'mouth_ooh', hmm: 'mouth_hmm' };
const mouthName = (k) => MOUTH_FOR[k] ?? `viseme_${k.replace(/^v_/, '')}`;

const NEUTRAL = rigValues({}, 'mouth_neutral');
const expressionValues = m.EXPRESSIONS.map((e) => ({
  name: e.name,
  values: rigValues({ ...e.p, turn: TURN[e.name] ?? 0, sway: SWAY[e.name] ?? 0 }, mouthName(e.p.mouth ?? 'half'), ARM[e.name]),
}));
// Arm poses with the face that goes with each.
const armPoses = {
  rest: rigValues({}, 'mouth_neutral'),
  writing: rigValues({ lidL: { inn: 0.5, out: 0.45 }, lidR: { inn: 0.5, out: 0.45 }, look: { x: -0.2, y: 0.9 }, tilt: 3 }, 'mouth_soft', { pose: 'writing', dx: -20, dy: -6 }),
  hold: rigValues({ browL: { dy: -6, rot: 4 }, browR: { dy: -3 }, tilt: -3, turn: 0.2, lidL: { inn: 1, out: 1 }, lidR: { inn: 1, out: 1 } }, 'mouth_expect', { pose: 'hold' }),
  watch: rigValues({ look: { x: 0.55, y: 0.95 }, lidL: { inn: 0.55, out: 0.5 }, lidR: { inn: 0.55, out: 0.5 }, tilt: 5, turn: 0.3, browL: { dy: -2 }, browR: { dy: -2 } }, 'mouth_soft', { pose: 'watch' }),
};
// One written line: the arm slides along the board (tilted -3°) with handwriting wiggles, then lifts back.
function writingPath() {
  const a = -3 * Math.PI / 180, F = [];
  for (let i = 0; i < 36; i++) { const s = -50 + 56 * i / 35; const wig = Math.sin(i * 2.1) * 2 + Math.sin(i * 0.9) * 1.1; F.push({ tx: r2(s * Math.cos(a)), ty: r2(s * Math.sin(a) + wig) }); }
  for (let i = 1; i <= 8; i++) { const s = 6 - 56 * i / 8; F.push({ tx: r2(s * Math.cos(a)), ty: r2(s * Math.sin(a) - 5 * Math.sin(Math.PI * i / 8)) }); }
  return { fps: 24, frames: F, note: 'arm_R translation per frame: 36 frames writing left to right, 8 frames lifting back. Loop while mood is writing.' };
}

module.exports = { partsSvg, pose, rigValues, NEUTRAL, expressionValues, armPoses, writingPath, MOUTH_KEYS, browPath, ARCH_MIN, ARCH_MAX, TILE, PARALLAX };

if (require.main === module) {
  fs.mkdirSync(__dirname + '/../parts', { recursive: true });
  fs.writeFileSync(__dirname + '/../parts/meera-parts.svg', pose(NEUTRAL));
  console.log('parts written', fs.statSync(__dirname + '/../parts/meera-parts.svg').size);
}
