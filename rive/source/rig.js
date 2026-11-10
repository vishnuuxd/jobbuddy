// Builds Meera's rig parts from the approved concept (meera.js).
// Every moving part is a named group with a pivot. Expressions are expressed
// only as transforms, opacity and one brow shape blend, the way Rive will play them.
const m = require('./meera.js');
const { C } = m;
const fs = require('fs');

const EYE = { L: { cx: 165, cy: 198 }, R: { cx: 235, cy: 198 }, rx: 20, ry: 23 };
const BROW = { L: { x: 162, y: 160 }, R: { x: 238, y: 160 } };
const H = 2 * EYE.ry;
const NEUTRAL_LID = 0.92;
const ARCH_MIN = -3, ARCH_MAX = 6;

const r2 = (n) => Math.round(n * 100) / 100;

// ---------- part geometry (neutral pose) ----------
const browPath = (a) => `M-23 3 Q-6 ${r2(-9 - a)} 23 -1 Q25 4 21 6 Q-4 ${r2(-1 - a)} -21 8 Q-26 7 -23 3 Z`;

function lidGeom(side) {
  const { cx, cy } = EYE[side];
  const { rx, ry } = EYE;
  const dir = side === 'L' ? 1 : -1;
  const top = cy - ry;
  const y = top + (1 - NEUTRAL_LID) * H;
  const xIn = cx + dir * (rx + 6), xOut = cx - dir * (rx + 6);
  return { cx, cy, rx, ry, dir, top, y, xIn, xOut };
}

function eyePart(side) {
  const g = lidGeom(side);
  const { cx, cy, rx, ry, dir, top, y, xIn, xOut } = g;
  const lid = `M${xOut} ${r2(y - 70)} L${xOut} ${r2(y)} Q${cx} ${r2(y + 3)} ${xIn} ${r2(y)} L${xIn} ${r2(y - 70)} Z`;
  const lash = `M${xOut} ${r2(y)} Q${cx} ${r2(y + 3)} ${xIn} ${r2(y)}`;
  const yLow = cy + ry;
  const low = `M${cx - rx - 3} ${yLow + 34} L${cx - rx - 3} ${yLow + 4} Q${cx} ${yLow - 2} ${cx + rx + 3} ${yLow + 4} L${cx + rx + 3} ${yLow + 34} Z`;
  const lowLine = `M${cx - rx - 3} ${yLow + 4} Q${cx} ${yLow - 2} ${cx + rx + 3} ${yLow + 4}`;
  const fx = cx - dir * (rx - 1);
  const fy = Math.max(y, top + 4) + 3;
  const flick = `M${fx} ${r2(fy)} q${-dir * 5} -1 ${-dir * 8} -6`;
  const s = side;
  return `
    <g id="eye_${s}" data-pivot="${cx} ${cy}">
      <defs>
        <clipPath id="clip_eye_${s}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
        <clipPath id="clip_lids_${s}"><ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry + 4}"/></clipPath>
      </defs>
      <g id="eye_open_${s}">
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
        <path id="lash_flick_${s}" d="${flick}" stroke="${C.line}" stroke-width="4" stroke-linecap="round" fill="none" {{lash_flick_${s}}}/>
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
  // meera.js mouths, with readable clip ids and no stray fills.
  let svg = m.mouthOnly(key).replace(/^[\s\S]*?<rect[^>]*\/>/, '').replace(/<\/svg>\s*$/, '');
  let n = 0;
  svg = svg.replace(/id="m\d+"/g, () => `id="clip_${name}${n++ ? '_' + n : ''}"`);
  n = 0;
  svg = svg.replace(/url\(#m\d+\)/g, () => `url(#clip_${name}${n++ ? '_' + n : ''})`);
  return `<g id="${name}" {{${name}}}>${svg.trim()}</g>`;
}

function partsSvg() {
  const brow = (s) => {
    const b = BROW[s];
    return `<g id="brow_${s}" data-pivot="${b.x} ${b.y}" {{brow_${s}}}><path id="brow_shape_${s}" d="{{brow_shape_${s}}}" fill="${C.line}" transform="scale(${s === 'L' ? 1 : -1} 1)"/></g>`;
  };
  const mouths = Object.entries(MOUTH_KEYS).map(([n, k]) => mouthPart(n, k)).join('\n      ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="400" height="440">
  <g id="meera">
    <circle id="halo" cx="200" cy="214" r="168" fill="${C.halo}"/>
    <g id="body" data-pivot="200 440" {{body}}>
      <path id="neck" d="M180 262 L220 262 L224 318 L176 318 Z" fill="${C.skin}"/>
      <path id="neck_shadow" d="M180 270 Q200 286 220 270 L220 262 L180 262 Z" fill="${C.skinShade}"/>
      <path id="blazer" d="M56 440 C60 360 92 330 150 314 L200 330 L250 314 C308 330 340 360 344 440 Z" fill="${C.blazer}"/>
      <path id="shirt" d="M164 312 L200 336 L236 312 L232 440 L168 440 Z" fill="${C.shirt}"/>
      <path id="collar_L" d="M164 312 L200 336 L184 352 L156 322 Z" fill="${C.shirtShade}"/>
      <path id="collar_R" d="M236 312 L200 336 L216 352 L244 322 Z" fill="${C.shirtShade}"/>
      <path id="lapel_L" d="M150 314 L182 360 L170 372 L176 440 L136 440 L128 360 Z" fill="${C.blazerShade}"/>
      <path id="lapel_R" d="M250 314 L218 360 L230 372 L224 440 L264 440 L272 360 Z" fill="${C.blazerShade}"/>
    </g>
    <g id="head" data-pivot="200 300" {{head}}>
      <circle id="bun" cx="200" cy="80" r="33" fill="${C.hair}"/>
      <path id="bun_shine" d="M188 58 Q204 52 218 62" stroke="${C.hairHi}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path id="hair_back" d="M108 200 C100 128 146 94 200 94 C256 94 300 128 292 200 C290 232 282 252 268 262 L132 262 C118 252 110 232 108 200 Z" fill="${C.hair}"/>
      <ellipse id="ear_L" cx="121" cy="202" rx="11" ry="15" fill="${C.skinShade}"/>
      <ellipse id="ear_R" cx="279" cy="202" rx="11" ry="15" fill="${C.skinShade}"/>
      <circle id="earring_L" cx="120" cy="222" r="5.5" fill="${C.lime}"/>
      <circle id="earring_R" cx="280" cy="222" r="5.5" fill="${C.lime}"/>
      <path id="face" d="M200 104 C252 104 280 140 280 192 C280 246 246 284 200 284 C154 284 120 246 120 192 C120 140 148 104 200 104 Z" fill="${C.skin}"/>
      <ellipse id="blush_L" cx="146" cy="232" rx="14" ry="8.5" fill="${C.blush}" {{blush}}/>
      <ellipse id="blush_R" cx="254" cy="232" rx="14" ry="8.5" fill="${C.blush}" {{blush}}/>
      <path id="hair_front" d="M114 204 C106 136 148 100 204 100 C260 100 296 136 286 204 C282 176 274 156 262 142 C242 136 218 126 198 108 C186 126 166 134 146 138 C132 154 120 176 114 204 Z" fill="${C.hair}"/>
      <path id="hair_shine" d="M226 108 C244 112 260 122 270 136" stroke="${C.hairHi}" stroke-width="5" stroke-linecap="round" fill="none"/>
      ${brow('L')}
      ${brow('R')}
      ${eyePart('L')}
      ${eyePart('R')}
      <g id="nose">
        <path id="nose_bridge" d="M203 206 Q206 220 204 226" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path id="nose_tip" d="M193 228 Q200 233 207 228" stroke="${C.skinShade}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      </g>
      <g id="mouth" data-pivot="200 248" {{mouth}}>
      ${mouths}
      </g>
    </g>
    <g id="notepad" data-pivot="130 400" transform="rotate(-8 130 400)">
      <rect id="notepad_page" x="84" y="366" width="96" height="74" rx="8" fill="${C.note}" stroke="#EEE9FF"/>
      <rect id="notepad_binding" x="84" y="366" width="96" height="12" rx="6" fill="${C.limeDark}"/>
      <path id="notepad_lines" d="M98 394 H164 M98 408 H156 M98 422 H140" stroke="${C.noteLine}" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>
    <g id="arm_R" data-pivot="330 440" {{arm_R}}>
      <path id="sleeve_R" d="M344 440 C340 420 330 404 312 396 L286 416 C296 424 304 432 306 440 Z" fill="${C.blazerShade}"/>
      <path id="wrist_R" d="M286 416 L312 396 L304 388 L280 408 Z" fill="${C.skin}"/>
      <g id="watch">
        <path id="watch_strap" d="M282 402 L304 384 L312 394 L290 412 Z" fill="${C.plum}"/>
        <circle id="watch_face" cx="297" cy="398" r="7.5" fill="${C.lime}" stroke="${C.plum}" stroke-width="2.5"/>
      </g>
      <g id="hand_R" data-pivot="282 372">
        <g id="pen">
          <path id="pen_body" d="M300 336 L262 404" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path id="pen_cap" d="M300 336 L295 345" stroke="${C.plum}" stroke-width="7" stroke-linecap="round" fill="none"/>
        </g>
        <path id="fist" d="M262 372 C262 356 276 348 290 352 C302 356 306 370 300 382 C294 392 280 394 270 390 C264 386 262 380 262 372 Z" fill="${C.skin}"/>
        <path id="knuckle_1" d="M268 366 C274 360 284 360 290 364" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path id="knuckle_2" d="M266 378 C272 374 282 374 288 378" stroke="${C.skinShade}" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>
    </g>
  </g>
</svg>`;
}

// ---------- expression values -> rig values ----------
function rigValues(p, mouthName) {
  p = m.merge(p);
  const v = { head: { rot: p.tilt }, blush: { opacity: p.blush }, mouth: mouthName };
  for (const s of ['L', 'R']) {
    const b = s === 'L' ? p.browL : p.browR;
    v[`brow_${s}`] = { ty: b.dy, rot: s === 'L' ? -b.rot : b.rot, arch: r2((b.arch - ARCH_MIN) / (ARCH_MAX - ARCH_MIN)) };
    const lid = s === 'L' ? p.lidL : p.lidR;
    const g = lidGeom(s);
    const yIn = g.top + (1 - lid.inn) * H, yOut = g.top + (1 - lid.out) * H;
    const ang = (Math.atan2(yIn - yOut, g.xIn - g.xOut) - Math.atan2(0, g.xIn - g.xOut)) * 180 / Math.PI;
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
  const piv = (s) => s.split(' ').map(Number);
  const t = {};
  const rotAt = (rot, [x, y]) => `rotate(${rot} ${x} ${y})`;
  t.head = `transform="${rotAt(v.head.rot, [200, 300])}"`;
  t.blush = `opacity="${v.blush.opacity}"`;
  t.body = ''; t.arm_R = ''; t.mouth = '';
  for (const s of ['L', 'R']) {
    const b = BROW[s], bv = v[`brow_${s}`];
    t[`brow_${s}`] = `transform="translate(${b.x} ${b.y + bv.ty}) rotate(${bv.rot})"`;
    const arch = ARCH_MIN + bv.arch * (ARCH_MAX - ARCH_MIN);
    t[`brow_shape_${s}`] = browPath(arch);
    const g = lidGeom(s), lu = v[`lid_upper_${s}`];
    t[`lid_upper_${s}`] = `transform="translate(0 ${lu.ty}) ${rotAt(lu.rot, [g.cx, g.y])}"`;
    const ll = v[`lid_lower_${s}`];
    t[`lid_lower_${s}`] = `transform="translate(0 ${ll.ty})"`;
    t[`lid_lower_line_${s}`] = `opacity="${ll.line}"`;
    t[`lash_flick_${s}`] = `transform="translate(0 ${v[`lash_flick_${s}`].ty})"`;
    const pv = v[`pupil_${s}`], [px, py] = piv(`${g.cx} ${g.cy + 2}`);
    t[`pupil_${s}`] = `transform="translate(${pv.tx} ${pv.ty}) translate(${px} ${py}) scale(${pv.scale}) translate(${-px} ${-py})"`;
    const mode = v[`eye_${s}`];
    t[`eye_happy_${s}`] = `opacity="${mode === 'happy' ? 1 : 0}"`;
    t[`eye_closed_${s}`] = `opacity="${mode === 'closed' ? 1 : 0}"`;
    t[`eye_open_${s}`] = mode === 'open' ? 1 : 0;
  }
  for (const n of Object.keys(MOUTH_KEYS)) t[n] = `opacity="${n === v.mouth ? 1 : 0}"`;
  let svg = partsSvg();
  svg = svg.replace(/<g id="eye_open_(L|R)">/g, (_, s) => `<g id="eye_open_${s}" opacity="${t[`eye_open_${s}`]}">`);
  return svg.replace(/\{\{([\w]+)\}\}/g, (_, k) => t[k] ?? '');
}

const NEUTRAL = rigValues({}, 'mouth_neutral');
const MOUTH_FOR = { half: 'mouth_neutral', smile: 'mouth_smile', laugh: 'mouth_laugh', flat: 'mouth_flat', soft: 'mouth_soft', expect: 'mouth_expect', oh: 'mouth_oh', ooh: 'mouth_ooh', hmm: 'mouth_hmm' };
const expressionValues = m.EXPRESSIONS.map((e) => {
  const mk = e.p.mouth ?? 'half';
  const mouthName = MOUTH_FOR[mk] ?? `viseme_${mk.replace(/^v_/, '')}`;
  return { name: e.name, values: rigValues(e.p, mouthName) };
});

module.exports = { partsSvg, pose, rigValues, NEUTRAL, expressionValues, MOUTH_KEYS, browPath, ARCH_MIN, ARCH_MAX };

if (require.main === module) {
  
  // Parts file: neutral pose, every mouth present, only the neutral one visible.
  fs.writeFileSync(__dirname + '/../parts/meera-parts.svg', pose(NEUTRAL));
  console.log('parts written', fs.statSync(__dirname + '/../parts/meera-parts.svg').size);
}
