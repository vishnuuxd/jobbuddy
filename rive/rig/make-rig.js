// Generates Meera's rig (v2) as RML from rive/parts/meera-parts.svg and rive/expressions.json.
// Run: node rive/rig/make-rig.js   (writes rive/meera.rml)
// The spec is rive/RIG.md. Nothing here is drawn by hand: every shape comes from the parts file.
const fs = require('fs');
const path = require('path');
const S = require('./svg.js');

const ROOT = path.join(__dirname, '..');
const parts = S.parseXml(fs.readFileSync(path.join(ROOT, 'parts/meera-parts.svg'), 'utf8'));
const X = JSON.parse(fs.readFileSync(path.join(ROOT, 'expressions.json'), 'utf8'));
const E = X.expressions;
const ARM = X.armPoses;
const RATES = X.controls.parallax.rates;

// ---------- the spec, in one place (RIG.md v2) ----------
const T = {
  moodBlendMs: 420, // mood cross-fades
  thinkingBlendMs: 600, // to and from thinking
  reactInMs: 90, // reactions in
  reactOutMs: 160, // and out
  armSwapMs: 120, // hold and watch: arm_R out, the pose group in, head and eyes into the pose
  mouthFadeMs: 40,
  blink: { closeMs: 67, holdMs: 33, openMs: 100, closedTy: X.blink.lid_upper_ty, waitsMs: [2500, 3000, 3500, 4000, 4500, 5000, 5500], singleWeight: 2, doubleWeight: 1 },
  holds: { smile: 1200, browRaise: 900, glanceDown: 800, handUp: 1200, checkWatch: 1400, leanIn: 1500, expectant: 2000, think: 2500, impressed: 1200, laugh: 1400, reassure: 1500, surprised: 800 },
  nod: [[0, 0], [150, 5.9], [300, -0.8], [430, 3.8], [600, 0]], // head y, ms
  nodBody: [[0, 0], [170, 1.5], [450, 0]],
  leanIn: { scale: 1.05, dy: 4, rotDeg: 1.4, inMs: 300, outMs: 200 },
  laugh: { bob: 3, lockDeg: 3 },
  surprised: { dy: -3 },
  browRaise: { up: { ty: -8, rot: 5 }, down: 1 },
  sitUp: { ms: 400, dy: -3, browDy: -2 },
  listening: { loopMs: 3600, turnFrom: 0.6, turnTo: 0.75, nods: [3.4, 2.5] },
  skeptical: { lidDy: 2, overMs: 2000 },
  thinking: { driftDeg: 2, loopMs: 4000, holdMs: 1000 },
  // Talking motion (layer 2). AMP scales the amplitudes; tuned against Alex's measure (5 to 6%).
  talk: { loopMs: 2000, amp: 0.8, bobs: [300, 900, 1600], bobPx: 4, tilt: [[0, 0], [400, 1.7], [850, -1], [1300, 1.4], [1700, 0.6], [2000, 0]], turn: [[0, 0], [500, 0.3], [1100, -0.3], [1600, 0.2], [2000, 0]], brows: [400, 1300], browPx: -2.5, pupil: [[0, 0], [600, 1], [1300, -1], [2000, 0]], bodyPx: 1.5 },
  breath: { loopMs: 4000, bodyDy: -1.7, bodySy: 1.01, headDy: 1.3, headDyAt: 1830, headRotDeg: 0.7, headRotAt: 2170 },
  follow: { lagMs: 120, overshoot: 0.4, settleMs: 300, talkGain: 0.6 },
  darts: { px: 2, moveMs: 100, ease: [0.2, 0.9, 0.3, 1] },
  mouthOpenScale: [0.94, 1.1], // the jaw: mouthOpen scales the talking mouth
  fallbackBands: [8, 30], // no alignment: rest below 8, teeth below 30, open above
};
const MOODS = ['idle', 'intake', 'listening', 'skeptical', 'writing', 'talking', 'thinking'];
const VISEMES = ['rest', 'closed', 'teeth', 'open', 'wide', 'round', 'pucker', 'fv', 'lth'];
const TRIGGERS = ['nod', 'smile', 'browRaise', 'glanceDown', 'handUp', 'checkWatch', 'sitUp', 'leanIn', 'expectant', 'think', 'impressed', 'laugh', 'reassure', 'surprised'];
const EXPRESSION_MOUTHS = X.expressionMouths;
const PARALLAX = ['features', 'nose', 'face', 'hair_front', 'hair_back'];
const RATE = { features: RATES.features, nose: RATES.nose, face: RATES.face, hair_front: RATES.hair_front, hair_back: RATES.hair_back };

// Extra nodes stacked inside a moving part, so each layer keys its own node and the motions add up.
// posture: sitUp, which stays. talk: the talking loop. react: one-off triggers. breath: breathing.
// dart: eye darts. The part node itself takes the mood and reaction poses.
const WRAPPERS = {
  head: ['head_posture', 'head_talk', 'head_react', 'head_breath'],
  body: ['body_posture', 'body_talk', 'body_react', 'body_breath'],
  brow_L: ['brow_L_posture', 'brow_L_talk'],
  brow_R: ['brow_R_posture', 'brow_R_talk'],
  pupil_L: ['pupil_L_talk', 'pupil_L_dart'],
  pupil_R: ['pupil_R_talk', 'pupil_R_dart'],
  lock_L: ['lock_L_talk', 'lock_L_react', 'lock_L_breath'],
  lock_R: ['lock_R_talk', 'lock_R_react', 'lock_R_breath'],
  ear_L: ['ear_L_talk'],
  ear_R: ['ear_R_talk'],
  features: ['features_talk'],
  nose: ['nose_talk'],
  face: ['face_talk'],
  hair_front: ['hair_front_talk'],
  hair_back: ['hair_back_talk'],
};

// ---------- ids and RML elements ----------
let nextId = 10;
const newId = () => `0:${nextId++}`;
const el = (tag, attrs = {}, children = []) => ({ tag, attrs, children });
const fmt = (n) => {
  if (typeof n !== 'number') return String(n);
  const r = Number(n.toFixed(4));
  return Object.is(r, -0) ? '0' : String(r);
};
function serialize(e, depth = 0) {
  const pad = '  '.repeat(depth);
  const attrs = Object.entries(e.attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => ` ${k}="${fmt(v)}"`)
    .join('');
  if (!e.children.length) return `${pad}<${e.tag}${attrs}/>`;
  return `${pad}<${e.tag}${attrs}>\n${e.children.map((c) => serialize(c, depth + 1)).join('\n')}\n${pad}</${e.tag}>`;
}

// Everything an animation can key, by name: { id, rest: {...} }.
const reg = {};
const register = (name, id, rest) => {
  if (reg[name]) throw new Error(`Duplicate rig name ${name}`);
  reg[name] = { id, rest };
};

// ---------- SVG parts to Rive nodes and shapes ----------
const clipDefs = {};
const gradients = {};
(function collect(e) {
  if (e.tag === 'clipPath') clipDefs[e.attrs.id] = e.children[0];
  if (e.tag === 'radialGradient') gradients[e.attrs.id] = e;
  e.children.forEach(collect);
})(parts);

const color = (hex, alpha = 1) => Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase() + hex.replace('#', '').toUpperCase();
const linearOf = (m) => [m[0], m[1], m[2], m[3], 0, 0];
const pct = (v) => (String(v).endsWith('%') ? parseFloat(v) / 100 : Number(v));

function placement(frameParent, frame) {
  return S.decomposeMirror(S.mul(S.inv(frameParent), frame));
}
function nodeAttrs(name, frameParent, frame, extra = {}) {
  const p = placement(frameParent, frame);
  const attrs = { x: p.x, y: p.y, name };
  if (Math.abs(p.rotation) > 1e-9) attrs.rotation = p.rotation;
  if (Math.abs(p.scaleX - 1) > 1e-9) attrs.scaleX = p.scaleX;
  if (Math.abs(p.scaleY - 1) > 1e-9) attrs.scaleY = p.scaleY;
  return { attrs: { ...attrs, ...extra }, rest: { x: p.x, y: p.y, rotation: p.rotation, scaleX: p.scaleX, scaleY: p.scaleY } };
}

// An SVG radial gradient in bounding-box units, on a shape centred on its origin (bw x bh).
// Rive's radial gradients are circular, so the radius is the mean of the two axes.
function radialFor(g, bw, bh) {
  const cx = -bw / 2 + pct(g.attrs.cx ?? '50%') * bw, cy = -bh / 2 + pct(g.attrs.cy ?? '50%') * bh;
  const r = pct(g.attrs.r ?? '50%') * (bw + bh) / 2;
  const stops = g.children.filter((s) => s.tag === 'stop').map((s) => el('GradientStop', { colorValue: color(s.attrs['stop-color'], Number(s.attrs['stop-opacity'] ?? 1)), position: Number(s.attrs.offset) }));
  return el('RadialGradient', { startX: cx, startY: cy, endX: cx + r, endY: cy, name: g.attrs.id }, stops);
}

function paints(svgEl, s, bbox) {
  const out = [];
  const fill = svgEl.attrs.fill ?? '#000000';
  const grad = fill.match(/url\(#([^)]+)\)/)?.[1];
  if (grad) out.push(el('Fill', { name: 'Fill' }, [radialFor(gradients[grad], bbox[0], bbox[1])]));
  else if (fill !== 'none') out.push(el('Fill', { name: 'Fill' }, [el('SolidColor', { colorValue: color(fill), name: 'Color' })]));
  if (svgEl.attrs.stroke && svgEl.attrs.stroke !== 'none') {
    out.push(
      el('Stroke', { thickness: Number(svgEl.attrs['stroke-width'] ?? 1) * s, cap: svgEl.attrs['stroke-linecap'] ?? 'butt', join: svgEl.attrs['stroke-linejoin'] ?? 'miter', name: 'Stroke' }, [
        el('SolidColor', { colorValue: color(svgEl.attrs.stroke), name: 'Color' }),
      ]),
    );
  }
  return out;
}

/** A Rive Shape for one SVG shape element, in the coordinates of `frame`. Clip sources get no paint. */
function shapeFor(svgEl, ctm, frame, name, { clipSource = false, keyVertices = false } = {}) {
  const rel = S.mul(S.inv(frame), ctm);
  const s = Math.hypot(rel[0], rel[1]);
  const rot = Math.atan2(rel[1], rel[0]);
  const id = newId();
  const a = svgEl.attrs;
  const children = [];
  let x = 0, y = 0, bbox = [0, 0];
  if (svgEl.tag === 'circle' || svgEl.tag === 'ellipse') {
    [x, y] = S.apply(rel, [Number(a.cx), Number(a.cy)]);
    const rx = Number(a.r ?? a.rx), ry = Number(a.r ?? a.ry);
    bbox = [2 * rx * s, 2 * ry * s];
    children.push(el('Ellipse', { width: bbox[0], height: bbox[1], originX: 0.5, originY: 0.5, name: 'Path' }));
  } else if (svgEl.tag === 'rect') {
    const w = Number(a.width), h = Number(a.height);
    [x, y] = S.apply(rel, [Number(a.x ?? 0) + w / 2, Number(a.y ?? 0) + h / 2]);
    bbox = [w * s, h * s];
    children.push(el('Rectangle', { width: bbox[0], height: bbox[1], originX: 0.5, originY: 0.5, cornerRadiusTL: Number(a.rx ?? 0) * s, name: 'Path' }));
  } else if (svgEl.tag === 'path') {
    S.parsePath(a.d).forEach((sp, k) => {
      const verts = S.subpathVertices(sp, rel).map((v, i) => {
        const hin = S.handle(v, v.in), hout = S.handle(v, v.out);
        const vName = `${name}_v${k ? k + '_' : ''}${i}`;
        const vid = keyVertices ? newId() : undefined;
        if (hin.distance < 1e-9 && hout.distance < 1e-9) return el('StraightVertex', { x: v.x, y: v.y, name: vName, id: vid });
        if (keyVertices) register(vName, vid, { x: v.x, y: v.y, ...hin, ...hout });
        return el('CubicDetachedVertex', { x: v.x, y: v.y, inRotation: hin.rotation, inDistance: hin.distance, outRotation: hout.rotation, outDistance: hout.distance, name: vName, id: vid });
      });
      children.push(el('PointsPath', { isClosed: sp.closed ? 'true' : 'false', name: `Path${k ? ' ' + k : ''}` }, verts));
    });
  } else throw new Error(`Unsupported shape <${svgEl.tag}>`);
  const attrs = { x, y, name, id };
  if (svgEl.tag !== 'path' && Math.abs(rot) > 1e-9) attrs.rotation = rot;
  if (a.opacity !== undefined && !clipSource) attrs.opacity = Number(a.opacity);
  if (!clipSource) children.push(...paints(svgEl, s, bbox));
  register(name, id, { x, y, rotation: attrs.rotation ?? 0, scaleX: 1, scaleY: 1, opacity: attrs.opacity ?? 1 });
  return el('Shape', attrs, children);
}

let anon = 0;
/** Converts SVG children into Rive children, front to back (Rive draws the first child on top). */
// SVG paint attributes inherit from groups to their children.
const INHERITED = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];
function convertChildren(svgParent, ctm, frame, parentName) {
  const out = [];
  const inherited = Object.fromEntries(INHERITED.filter((k) => svgParent.attrs?.[k] !== undefined).map((k) => [k, svgParent.attrs[k]]));
  for (const raw of svgParent.children) {
    const child = Object.keys(inherited).length ? { ...raw, attrs: { ...inherited, ...raw.attrs } } : raw;
    if (['defs', 'clipPath', 'radialGradient', 'linearGradient'].includes(child.tag)) continue;
    out.push(...convert(child, ctm, frame, parentName));
  }
  return out.reverse();
}

/** Returns the Rive elements for one SVG element, in back-to-front order (convertChildren reverses). */
function convert(svgEl, ctmParent, frameParent, parentName) {
  const a = svgEl.attrs;
  const name = a.id || `${parentName}_${svgEl.tag}${++anon}`;
  const ctm = S.mul(ctmParent, S.parseTransform(a.transform));
  const extraNodes = []; // clip sources sit beside the clipped node

  if (svgEl.tag === 'g') {
    // A group's frame: its pivot if it has one, else its own transform, else its parent's frame.
    let frame;
    if (a['data-pivot']) {
      const [px, py] = a['data-pivot'].split(/\s+/).map(Number);
      frame = S.mul(S.mul(ctmParent, S.translate(px, py)), linearOf(S.parseTransform(a.transform)));
    } else if (a.transform) frame = ctm;
    else frame = frameParent;
    const id = newId();
    const { attrs, rest } = nodeAttrs(name, frameParent, frame, { id });
    if (a.opacity !== undefined) attrs.opacity = Number(a.opacity);
    register(name, id, { ...rest, opacity: attrs.opacity ?? 1 });

    let children;
    if (name === 'mouth') {
      // Two sets inside the mouth: expression mouths, and the visemes that mouthOpen scales (the jaw).
      const groupFor = (setName, filter) => {
        const gid = newId();
        register(setName, gid, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 });
        const kids = convertChildren({ children: svgEl.children.filter(filter) }, ctm, frame, setName);
        return el('Node', { x: 0, y: 0, name: setName, id: gid }, kids);
      };
      const talk = groupFor('mouth_talk', (c) => c.attrs.id?.startsWith('viseme_'));
      talk.attrs.opacity = 0;
      reg.mouth_talk.rest.opacity = 0;
      talk.children.unshift(el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props.mouthOpen.id}`, propertyKey: 17, converterId: CONVERTERS.mouthOpen }));
      children = [talk, groupFor('mouth_expr', (c) => c.attrs.id?.startsWith('mouth_'))];
    } else {
      children = convertChildren(svgEl, ctm, frame, name);
    }

    // Clipped group: a ClippingShape inside, and its source shape beside it in the same frame.
    const clipRef = a['clip-path']?.match(/url\(#([^)]+)\)/)?.[1];
    if (clipRef) {
      const srcName = `${name}_clipsrc_${clipRef}`;
      const src = shapeFor(clipDefs[clipRef], ctmParent, frameParent, srcName, { clipSource: true });
      extraNodes.push(src);
      children.unshift(el('ClippingShape', { sourceId: src.attrs.id, name: `Clip ${clipRef}` }));
    }

    // Stacked wrapper nodes for additive motion, each at the same pivot.
    for (const w of [...(WRAPPERS[name] ?? [])].reverse()) {
      const wid = newId();
      register(w, wid, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 });
      children = [el('Node', { x: 0, y: 0, name: w, id: wid }, children)];
    }
    return [...extraNodes, el('Node', attrs, children)];
  }

  // A shape with its own transform gets a node, so the transform can move.
  if (a.transform) {
    const frame = ctm;
    const id = newId();
    const { attrs, rest } = nodeAttrs(name, frameParent, frame, { id });
    register(name, id, { ...rest, opacity: 1 });
    let kids = [shapeFor({ ...svgEl, attrs: { ...a, id: undefined } }, ctm, frame, `${name}_shape`, { keyVertices: name.startsWith('brow_shape_') })];
    for (const w of [...(WRAPPERS[name] ?? [])].reverse()) {
      const wid = newId();
      register(w, wid, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 });
      kids = [el('Node', { x: 0, y: 0, name: w, id: wid }, kids)];
    }
    return [el('Node', attrs, kids)];
  }
  return [shapeFor(svgEl, ctmParent, frameParent, name)];
}

// ---------- view model ----------
const VM = { id: newId(), instanceId: newId(), props: {}, enums: {} };
const enumOf = (enumName, keys) => {
  const id = newId();
  const values = Object.fromEntries(keys.map((k) => [k, newId()]));
  VM.enums[enumName] = { id, values, keys };
  return el('DataEnumCustom', { name: enumName, id }, keys.map((k) => el('DataEnumValue', { key: k, value: k, id: values[k] })));
};
const enums = [enumOf('Mood', MOODS), enumOf('Viseme', VISEMES)];
const prop = (name, tag, extra = {}) => (VM.props[name] = { id: newId(), tag, extra });
prop('mood', 'ViewModelPropertyEnumCustom', { enumId: VM.enums.Mood.id });
prop('viseme', 'ViewModelPropertyEnumCustom', { enumId: VM.enums.Viseme.id });
prop('mouthOpen', 'ViewModelPropertyNumber');
for (const t of TRIGGERS) prop(t, 'ViewModelPropertyTrigger');
// Not an InterviewVM value: the avatar component sets it from prefers-reduced-motion, like offline.
prop('reducedMotion', 'ViewModelPropertyBoolean');
// InterviewVM.lipSync: true while the audio playing has letter timing. False, the mouth comes from mouthOpen.
prop('lipSync', 'ViewModelPropertyBoolean');

const CONVERTERS = { mouthOpen: newId() };
const converters = [
  el('DataConverterRangeMapper', { minInput: 0, maxInput: 100, minOutput: T.mouthOpenScale[0], maxOutput: T.mouthOpenScale[1], clampLower: 'true', clampUpper: 'true', name: 'mouthOpen to jaw', id: CONVERTERS.mouthOpen }),
];

function viewModel() {
  const props = Object.entries(VM.props).map(([name, p]) => el(p.tag, { ...p.extra, name, id: p.id }));
  const values = Object.entries(VM.props).map(([name, p]) => {
    if (name === 'mood') return el('ViewModelInstanceEnum', { propertyValue: VM.enums.Mood.values.idle, viewModelPropertyId: p.id });
    if (name === 'viseme') return el('ViewModelInstanceEnum', { propertyValue: VM.enums.Viseme.values.rest, viewModelPropertyId: p.id });
    if (p.tag === 'ViewModelPropertyNumber') return el('ViewModelInstanceNumber', { propertyValue: 0, viewModelPropertyId: p.id });
    if (p.tag === 'ViewModelPropertyBoolean') return el('ViewModelInstanceBoolean', { propertyValue: 'false', viewModelPropertyId: p.id });
    return el('ViewModelInstanceTrigger', { viewModelPropertyId: p.id });
  });
  return el('ViewModel', { defaultInstanceId: VM.instanceId, name: 'InterviewVM', id: VM.id }, [...props, el('ViewModelInstance', { exports: 'true', name: 'Default', id: VM.instanceId }, values)]);
}

// ---------- the scene ----------
const sceneRoot = el('Root', {}, convertChildren(parts, S.I, S.I, 'root'));

// Blink: each upper lid and lash flick is pulled to a closed target by TransformConstraints, so a
// blink closes the lid fully from whatever pose it's in and opens back to it. Two constraints per
// part: one for the blink timer, one for the blink that starts every reaction, so they never fight.
function findEl(e, name) {
  if (e.attrs?.name === name) return e;
  for (const c of e.children ?? []) {
    const f = findEl(c, name);
    if (f) return f;
  }
  return null;
}
function parentOf(e, target) {
  for (const c of e.children ?? []) {
    if (c === target) return e;
    const f = parentOf(c, target);
    if (f) return f;
  }
  return null;
}
function addBlinkTargets(partName, closedDy) {
  const node = findEl(sceneRoot, partName);
  const parent = parentOf(sceneRoot, node);
  const r = reg[partName].rest;
  const tid = newId();
  parent.children.push(el('Node', { x: r.x, y: r.y + closedDy, name: `${partName}_closed`, id: tid }));
  for (const kind of ['rblink', 'blink']) {
    const cid = newId();
    node.children.unshift(el('TransformConstraint', { targetId: tid, strength: 0, name: `${partName}_${kind}`, id: cid }));
    register(`${partName}_${kind}`, cid, { strength: 0 });
  }
}
for (const s of ['L', 'R']) {
  addBlinkTargets(`lid_upper_${s}`, T.blink.closedTy);
  addBlinkTargets(`lash_flick_${s}`, 42);
}

// ---------- poses ----------
const rad = (deg) => (deg * Math.PI) / 180;
const clone = (v) => JSON.parse(JSON.stringify(v));
const browVerts = (arch) => {
  const a = -3 + arch * 9; // arch_min a = -3, arch_max a = 6 (expressions.json browShapes)
  const d = `M-23 3 Q-6 ${-9 - a} 23 -1 Q25 4 21 6 Q-4 ${-1 - a} -21 8 Q-26 7 -23 3 Z`;
  return S.subpathVertices(S.parsePath(d)[0], S.I).map((v) => ({ in: S.handle(v, v.in), out: S.handle(v, v.out) }));
};
/** Parallax for a turn value (RIG.md: one number drives all six groups). */
function parallax(t) {
  return {
    features: { tx: RATE.features * t }, nose: { tx: RATE.nose * t }, face: { tx: RATE.face * t },
    hair_front: { tx: RATE.hair_front * t }, hair_back: { tx: RATE.hair_back * t },
    ear_L: { tx: RATES.ears * t, sx: t > 0 ? 1 - RATES.farEar * t : 1 },
    ear_R: { tx: RATES.ears * t, sx: t < 0 ? 1 + RATES.farEar * t : 1 },
  };
}
const withTurn = (v, t) => ({ ...clone(v), turn: t, ...parallax(t) });
const IDLE = withTurn(E.listening, 0); // idle: listening, turn 0

const isEyes = (n) => /^(lid_|lash_flick_|pupil_|eye_)/.test(n);
/** The keys for one pose. `only` limits them (glanceDown, leanIn: eyes only). Arm keys are separate. */
function poseKeys(v, only) {
  const k = [];
  const set = (name, property, value) => {
    if (!reg[name]) throw new Error(`No rig part ${name}`);
    if (!only || only(name)) k.push({ name, property, value });
  };
  const r = (n) => reg[n].rest;
  set('head', 'rotation', r('head').rotation + rad(v.head.rot));
  set('blush_L', 'opacity', v.blush.opacity);
  set('blush_R', 'opacity', v.blush.opacity);
  for (const p of PARALLAX) set(p, 'x', r(p).x + v[p].tx);
  for (const s of ['L', 'R']) {
    set(`ear_${s}`, 'x', r(`ear_${s}`).x + v[`ear_${s}`].tx);
    set(`ear_${s}`, 'scaleX', v[`ear_${s}`].sx);
    set(`lock_${s}`, 'rotation', rad(v[`lock_${s}`].rot));
    const b = v[`brow_${s}`];
    set(`brow_${s}`, 'y', r(`brow_${s}`).y + b.ty);
    set(`brow_${s}`, 'rotation', rad(b.rot));
    browVerts(b.arch).forEach((h, i) => {
      const vn = `brow_shape_${s}_shape_v${i}`;
      set(vn, 'inRotation', h.in.rotation);
      set(vn, 'inDistance', h.in.distance);
      set(vn, 'outRotation', h.out.rotation);
      set(vn, 'outDistance', h.out.distance);
    });
    const lu = v[`lid_upper_${s}`];
    set(`lid_upper_${s}`, 'y', r(`lid_upper_${s}`).y + lu.ty);
    set(`lid_upper_${s}`, 'rotation', rad(lu.rot));
    const ll = v[`lid_lower_${s}`];
    set(`lid_lower_${s}`, 'y', r(`lid_lower_${s}`).y + ll.ty);
    set(`lid_lower_line_${s}`, 'opacity', ll.line);
    set(`lash_flick_${s}`, 'y', r(`lash_flick_${s}`).y + v[`lash_flick_${s}`].ty);
    const p = v[`pupil_${s}`];
    set(`pupil_${s}`, 'x', r(`pupil_${s}`).x + p.tx);
    set(`pupil_${s}`, 'y', r(`pupil_${s}`).y + p.ty);
    set(`pupil_${s}`, 'scaleX', p.scale);
    set(`pupil_${s}`, 'scaleY', p.scale);
    const mode = v[`eye_${s}`];
    set(`eye_open_${s}`, 'opacity', mode === 'open' ? 1 : 0);
    set(`eye_happy_${s}`, 'opacity', mode === 'happy' ? 1 : 0);
    set(`eye_closed_${s}`, 'opacity', mode === 'closed' ? 1 : 0);
  }
  // The expression's own mouth. A viseme here (talking) means the mouth comes from the viseme layer.
  const mouth = EXPRESSION_MOUTHS.includes(v.mouth) ? v.mouth : 'mouth_neutral';
  for (const m of EXPRESSION_MOUTHS) set(m, 'opacity', m === mouth ? 1 : 0);
  return k;
}
/** arm_R's translation, for rest and writing (the Mood layer owns it). */
const armKeys = (tx = 0, ty = 0) => [
  { name: 'arm_R', property: 'x', value: reg.arm_R.rest.x + tx },
  { name: 'arm_R', property: 'y', value: reg.arm_R.rest.y + ty },
];

// ---------- animations ----------
const animations = [];
const FPS = 1000; // frames are milliseconds
function anim(name, duration, tracks, { loop = false } = {}) {
  const id = newId();
  const byObj = new Map();
  for (const t of tracks) {
    if (!byObj.has(t.name)) byObj.set(t.name, new Map());
    byObj.get(t.name).set(t.property, t); // a later track on the same property wins
  }
  const keyed = [...byObj.entries()].map(([name, props]) =>
    el('KeyedObject', { objectId: reg[name].id }, [...props.values()].map((t) =>
      el('KeyedProperty', { property: t.property }, (t.keys ?? [{ frame: 0, value: t.value }]).map((k) => {
        const attrs = { value: k.value, frame: Math.round(k.frame), interpolationType: k.ease ? 'cubic' : k.linear ? 'linear' : 'hold' };
        const kids = k.ease ? [el('CubicEaseInterpolator', { x1: k.ease[0], y1: k.ease[1], x2: k.ease[2], y2: k.ease[3] })] : [];
        return el('KeyFrameDouble', attrs, kids);
      })),
    )),
  );
  animations.push(el('LinearAnimation', { fps: FPS, duration: Math.max(1, Math.round(duration)), loopValue: loop ? 'loop' : 'oneShot', name, id }, keyed));
  return id;
}
const EASE = [0.42, 0, 0.58, 1];
const EASE_OUT = [0, 0, 0.58, 1];
const EASE_IN = [0.42, 0, 1, 1];
/** Eased keys through [ms, value] points; the last key holds. */
const curve = (pts, map = (v) => v, ease = EASE) => pts.map(([f, v], i) => ({ frame: f, value: map(v), ...(i < pts.length - 1 ? { ease } : {}) }));
/** Keys for many parts from a turn curve: [ms, turn] points. On the *_talk wrappers or the pose nodes. */
function turnTracks(pts, suffix, base = null) {
  const out = [];
  for (const p of PARALLAX) {
    const n = suffix ? `${p}_${suffix}` : p;
    const rest = suffix ? 0 : reg[p].rest.x;
    out.push({ name: n, property: 'x', keys: curve(pts, (t) => rest + (base ? base[p].tx : 0) + RATE[p] * t) });
  }
  for (const s of ['L', 'R']) {
    const n = suffix ? `ear_${s}_${suffix}` : `ear_${s}`;
    const rest = suffix ? 0 : reg[`ear_${s}`].rest.x;
    out.push({ name: n, property: 'x', keys: curve(pts, (t) => rest + RATES.ears * t) });
    const far = (t) => (s === 'L' ? (t > 0 ? 1 - RATES.farEar * t : 1) : t < 0 ? 1 + RATES.farEar * t : 1);
    out.push({ name: n, property: 'scaleX', keys: curve(pts, far) });
  }
  return out;
}

// Hair follow-through: the locks' world angle chases the head's, 120 ms late, through a spring that
// overshoots by about 40% and settles in about 300 ms. Locks are inside the head, so they're keyed
// with the difference (world minus head). Sampled every 40 ms and baked into keys.
function smooth(p) { return p * p * (3 - 2 * p); }
function sampler(pts) {
  return (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
        return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0 || 1));
      }
    }
    return pts[pts.length - 1][1];
  };
}
function followKeys(headPts, { lengthMs, loop = false, gain = 1, stepMs = 40 } = {}) {
  const f = T.follow;
  const zeta = 0.28; // ~40% overshoot
  const omega = 4 / (zeta * (f.settleMs / 1000)); // settles in about settleMs
  const h = sampler(headPts);
  const periods = loop ? 3 : 1;
  let w = h(0), dw = 0;
  const out = [];
  const dt = 1 / 1000;
  for (let ms = 0; ms <= periods * lengthMs; ms++) {
    const local = ms % lengthMs;
    const target = h(loop ? ((ms - f.lagMs) % lengthMs + lengthMs) % lengthMs : Math.max(0, ms - f.lagMs));
    const acc = omega * omega * (target - w) - 2 * zeta * omega * dw;
    dw += acc * dt;
    w += dw * dt;
    const inLast = !loop || ms >= (periods - 1) * lengthMs;
    if (inLast && local % stepMs === 0) out.push([loop ? local : ms, gain * (w - h(local))]);
  }
  if (loop) out.push([lengthMs, out[0][1]]);
  return out.map(([t, v], i, arr) => ({ frame: t, value: rad(v), ...(i < arr.length - 1 ? { linear: true } : {}) }));
}
const lockTracks = (suffix, keys) => ['L', 'R'].map((s) => ({ name: `lock_${s}_${suffix}`, property: 'rotation', keys }));

// ---- Mood layer: the moods, and the face part of each reaction ----
const moodAnims = {};
// Every mood keys head.y (listening's nods move it), so blends between moods never leave it behind.
const headY = () => ({ name: 'head', property: 'y', value: reg.head.rest.y });
moodAnims.idle = anim('mood_idle', 100, [...poseKeys(IDLE), ...armKeys(), headY()]);
moodAnims.intake = anim('mood_intake', 100, [...poseKeys(E.expectant), ...armKeys(), headY()]);
{
  // listening: the turn drifts 0.6 -> 0.75 -> 0.6 every 3.6 s; every second loop, a slow double nod.
  const L = T.listening, len = 2 * L.loopMs;
  const turns = [[0, L.turnFrom], [L.loopMs / 2, L.turnTo], [L.loopMs, L.turnFrom], [1.5 * L.loopMs, L.turnTo], [len, L.turnFrom]];
  const headY = reg.head.rest.y, n0 = L.loopMs + 1400;
  moodAnims.listening = anim('mood_listening', len, [
    ...poseKeys(E.listening), ...armKeys(),
    ...turnTracks(turns, null),
    { name: 'head', property: 'y', keys: curve([[0, 0], [n0, 0], [n0 + 250, L.nods[0]], [n0 + 500, 0], [n0 + 750, L.nods[1]], [n0 + 1000, 0], [len, 0]], (v) => headY + v) },
  ], { loop: true });
}
{
  // skeptical: the squint deepens slowly, lids +2 px over 2 s, then holds.
  const sk = T.skeptical, keys = poseKeys(E.skeptical);
  for (const s of ['L', 'R']) {
    const base = reg[`lid_upper_${s}`].rest.y + E.skeptical[`lid_upper_${s}`].ty;
    keys.push({ name: `lid_upper_${s}`, property: 'y', keys: curve([[0, base], [sk.overMs, base + sk.lidDy]]) });
  }
  moodAnims.skeptical = anim('mood_skeptical', sk.overMs, [...keys, ...armKeys(), { name: 'head', property: 'y', value: reg.head.rest.y }]);
}
{
  // writing: the arm plays writingPath (24 fps) on a loop.
  const W = X.writingPath, step = 1000 / W.fps, len = W.frames.length * step;
  const fr = [...W.frames, W.frames[0]];
  moodAnims.writing = anim('mood_writing', len, [
    ...poseKeys(E.writing), { name: 'head', property: 'y', value: reg.head.rest.y },
    { name: 'arm_R', property: 'x', keys: fr.map((f, i) => ({ frame: i * step, value: reg.arm_R.rest.x + f.tx, ...(i < fr.length - 1 ? { linear: true } : {}) })) },
    { name: 'arm_R', property: 'y', keys: fr.map((f, i) => ({ frame: i * step, value: reg.arm_R.rest.y + f.ty, ...(i < fr.length - 1 ? { linear: true } : {}) })) },
  ], { loop: true });
}
moodAnims.talking = anim('mood_talking', 100, [...poseKeys(E.talking), ...armKeys(), { name: 'head', property: 'y', value: reg.head.rest.y }]);
let thinkingFollow;
{
  // thinking: held, then a slow 2° tilt drift, with the locks following.
  const th = T.thinking, base = E.thinking.head.rot, len = th.loopMs;
  const pts = [[0, base], [th.holdMs, base], [th.holdMs + (len - th.holdMs) / 2, base + th.driftDeg], [len, base]];
  thinkingFollow = followKeys(pts.map(([t, v]) => [t, v - base]), { lengthMs: len });
  moodAnims.thinking = anim('mood_thinking', len, [
    ...poseKeys(E.thinking), ...armKeys(), { name: 'head', property: 'y', value: reg.head.rest.y },
    { name: 'head', property: 'rotation', keys: curve(pts, (d) => reg.head.rest.rotation + rad(d)) },
    ...['L', 'R'].map((s) => ({ name: `lock_${s}`, property: 'rotation', keys: thinkingFollow.map((k) => ({ ...k, value: rad(E.thinking[`lock_${s}`].rot) + k.value })) })),
  ], { loop: true });
}

// Reaction faces (Mood layer): in 90 ms, hold, out 160 ms back to the current mood.
const asymBrowRaise = (() => {
  const v = clone(E.interested);
  v.brow_R = { ...v.brow_R, ty: T.browRaise.up.ty, rot: T.browRaise.up.rot };
  v.brow_L = { ...v.brow_L, ty: T.browRaise.down };
  return v;
})();
const reactFace = {
  smile: { pose: E.warmSmile },
  browRaise: { pose: asymBrowRaise },
  glanceDown: { pose: E.writing, only: isEyes },
  handUp: { pose: ARM.hold, inMs: T.armSwapMs },
  checkWatch: { pose: ARM.watch, inMs: T.armSwapMs },
  leanIn: { pose: E.interested, only: isEyes },
  expectant: { pose: E.expectant, untilTalking: true },
  think: { pose: E.thinking, untilTalking: true },
  impressed: { pose: E.impressed },
  laugh: { pose: E.laughing },
  reassure: { pose: E.reassuring },
  surprised: { pose: E.surprised },
};
for (const [t, f] of Object.entries(reactFace)) {
  f.inMs ??= T.reactInMs;
  f.anim = anim(`face_${t}`, f.inMs + T.holds[t], poseKeys(f.pose, f.only));
}

// ---- Reactions layer: movement, arm swaps, and the blink that starts every reaction ----
const rblinkParts = ['lid_upper_L', 'lid_upper_R', 'lash_flick_L', 'lash_flick_R'].map((p) => `${p}_rblink`);
const b = T.blink;
const blinkCurve = (t0 = 0) => [
  { frame: t0, value: 0, ease: EASE_IN },
  { frame: t0 + b.closeMs, value: 1 },
  { frame: t0 + b.closeMs + b.holdMs, value: 1, ease: EASE_OUT },
  { frame: t0 + b.closeMs + b.holdMs + b.openMs, value: 0 },
];
const blinkLen = b.closeMs + b.holdMs + b.openMs;
const reactRest = {
  head_react: { y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  body_react: { y: 0 },
  lock_L_react: { rotation: 0 },
  lock_R_react: { rotation: 0 },
  arm_R: { opacity: 1 },
  arm_hold: { opacity: 0 },
  arm_watch: { opacity: 0 },
};
/** A reaction: rest values for everything, overridden by `tracks`, plus the opening blink. */
function reaction(name, length, tracks = []) {
  const all = [];
  for (const [n, props] of Object.entries(reactRest)) for (const [p, v] of Object.entries(props)) all.push({ name: n, property: p, value: v });
  for (const n of rblinkParts) all.push({ name: n, property: 'strength', keys: blinkCurve() });
  return anim(`react_${name}`, Math.max(length, blinkLen), [...all, ...tracks]);
}
const reactRestAnim = (() => {
  const all = [];
  for (const [n, props] of Object.entries(reactRest)) for (const [p, v] of Object.entries(props)) all.push({ name: n, property: p, value: v });
  for (const n of rblinkParts) all.push({ name: n, property: 'strength', value: 0 });
  return anim('react_rest', 100, all);
})();
const hold = (inMs, holdMs, outMs, peak, base = 0) => [[0, base], [inMs, peak], [inMs + holdMs, peak], [inMs + holdMs + outMs, base]];
const armSwap = (group, holdMs) => {
  const s = T.armSwapMs, o = T.reactOutMs, end = s + holdMs + o;
  return [
    { name: 'arm_R', property: 'opacity', keys: curve(hold(s, holdMs, o, 0, 1)) },
    { name: group, property: 'opacity', keys: curve(hold(s, holdMs, o, 1, 0)) },
    end,
  ];
};
const reactions = {};
const reactionsStill = {}; // reduced motion: the blink, the face and arm swaps; no movement
{
  const nodLen = T.nod[T.nod.length - 1][0];
  reactions.nod = reaction('nod', nodLen, [
    { name: 'head_react', property: 'y', keys: curve(T.nod) },
    { name: 'body_react', property: 'y', keys: curve(T.nodBody) },
  ]);
  const li = T.leanIn, liLen = li.inMs + T.holds.leanIn + li.outMs;
  const liPts = hold(li.inMs, T.holds.leanIn, li.outMs, 1);
  reactions.leanIn = reaction('leanIn', liLen, [
    { name: 'head_react', property: 'scaleX', keys: curve(liPts, (p) => 1 + (li.scale - 1) * p) },
    { name: 'head_react', property: 'scaleY', keys: curve(liPts, (p) => 1 + (li.scale - 1) * p) },
    { name: 'head_react', property: 'y', keys: curve(liPts, (p) => li.dy * p) },
    { name: 'head_react', property: 'rotation', keys: curve(liPts, (p) => rad(li.rotDeg * p)) },
    ...lockTracks('react', followKeys(liPts.map(([t, p]) => [t, li.rotDeg * p]), { lengthMs: liLen })),
  ]);
  const la = T.laugh, laLen = T.holds.laugh;
  reactions.laugh = reaction('laugh', laLen, [
    { name: 'head_react', property: 'y', keys: curve([[0, 0], [200, la.bob], [450, 0], [700, la.bob], [950, 0], [laLen, 0]]) },
    ...lockTracks('react', curve([[0, 0], [250, la.lockDeg], [550, -la.lockDeg], [850, la.lockDeg * 0.6], [1100, -la.lockDeg * 0.3], [laLen, 0]], rad)),
  ]);
  const su = T.surprised, suLen = T.reactInMs + T.holds.surprised + T.reactOutMs;
  reactions.surprised = reaction('surprised', suLen, [{ name: 'head_react', property: 'y', keys: curve(hold(120, T.holds.surprised, T.reactOutMs, su.dy)) }]);
  for (const [t, group] of [['handUp', 'arm_hold'], ['checkWatch', 'arm_watch']]) {
    const [r, g, end] = armSwap(group, T.holds[t]);
    reactions[t] = reaction(t, end, [r, g]);
  }
  for (const t of ['smile', 'browRaise', 'glanceDown', 'sitUp', 'expectant', 'think', 'impressed', 'reassure']) reactions[t] = reaction(t, blinkLen);
  for (const t of ['nod', 'leanIn', 'laugh', 'surprised']) reactionsStill[t] = reaction(`${t}_still`, blinkLen);
}

// ---- Posture: sitUp, then it stays for the call ----
const postureNodes = (dy, browDy) => [
  ...['body_posture', 'head_posture'].map((name) => ({ name, property: 'y', value: dy })),
  ...['brow_L_posture', 'brow_R_posture'].map((name) => ({ name, property: 'y', value: browDy })),
];
const postureRest = anim('posture_rest', 100, postureNodes(0, 0));
const postureSitUp = anim('posture_sitUp', 100, postureNodes(T.sitUp.dy, T.sitUp.browDy));

// ---- Talking motion (layer 2): a 2 s irregular loop ----
function talkAnim(amp) {
  const tk = T.talk, len = tk.loopMs;
  const bob = (px) => {
    const pts = [[0, 0]];
    for (const at of tk.bobs) pts.push([at - 130, 0], [at, px * amp], [at + 200, 0]);
    pts.push([len, 0]);
    return pts.sort((a, b) => a[0] - b[0]).filter((p, i, arr) => i === 0 || p[0] > arr[i - 1][0]);
  };
  const tilt = tk.tilt.map(([t, d]) => [t, d * amp]);
  const turn = tk.turn.map(([t, v]) => [t, v * amp]);
  const brow = [[0, 0], ...tk.brows.flatMap((at) => [[at - 120, 0], [at, tk.browPx * amp], [at + 220, 0]]), [len, 0]];
  return anim(`talk_loop`, len, [
    { name: 'head_talk', property: 'y', keys: curve(bob(tk.bobPx)) },
    { name: 'head_talk', property: 'rotation', keys: curve(tilt, rad) },
    { name: 'body_talk', property: 'y', keys: curve(bob(tk.bodyPx)) },
    ...turnTracks(turn, 'talk'),
    ...['L', 'R'].map((s) => ({ name: `brow_${s}_talk`, property: 'y', keys: curve(brow) })),
    ...['L', 'R'].map((s) => ({ name: `pupil_${s}_talk`, property: 'x', keys: curve(tk.pupil.map(([t, v]) => [t, v * amp])) })),
    ...lockTracks('talk', followKeys(tilt, { lengthMs: len, loop: true, gain: T.follow.talkGain })),
  ], { loop: true });
}
const talkLoop = talkAnim(T.talk.amp);
const talkStill = anim('talk_still', 100, [
  ...['head_talk', 'body_talk'].flatMap((n) => [{ name: n, property: 'y', value: 0 }]),
  { name: 'head_talk', property: 'rotation', value: 0 },
  ...turnTracks([[0, 0]], 'talk'),
  ...['L', 'R'].flatMap((s) => [
    { name: `brow_${s}_talk`, property: 'y', value: 0 },
    { name: `pupil_${s}_talk`, property: 'x', value: 0 },
    { name: `lock_${s}_talk`, property: 'rotation', value: 0 },
  ]),
]);

// ---- Breathing and follow-through (layer 7): a 4 s loop, the parts slightly offset ----
const br = T.breath;
const headRot = [[0, 0], [br.headRotAt, br.headRotDeg], [br.loopMs, 0]];
const breathLoop = anim('breath_loop', br.loopMs, [
  { name: 'body_breath', property: 'y', keys: curve([[0, 0], [br.loopMs / 2, br.bodyDy], [br.loopMs, 0]]) },
  { name: 'body_breath', property: 'scaleY', keys: curve([[0, 1], [br.loopMs / 2, br.bodySy], [br.loopMs, 1]]) },
  { name: 'head_breath', property: 'y', keys: curve([[0, 0], [br.headDyAt, br.headDy], [br.loopMs, 0]]) },
  { name: 'head_breath', property: 'rotation', keys: curve(headRot, rad) },
  ...lockTracks('breath', followKeys(headRot, { lengthMs: br.loopMs, loop: true })),
], { loop: true });
const breathStill = anim('breath_still', 100, [
  { name: 'body_breath', property: 'y', value: 0 }, { name: 'body_breath', property: 'scaleY', value: 1 },
  { name: 'head_breath', property: 'y', value: 0 }, { name: 'head_breath', property: 'rotation', value: 0 },
  ...lockTracks('breath', [{ frame: 0, value: 0 }]),
]);

// ---- Eye darts (layer 5): about 2 px, made in 100 ms, held 1.1 to 1.3 s. Three loops, picked at random ----
const D = T.darts;
const dartSets = [
  [[150, -1, 0.3], [1400, 0.8, -0.6], [2650, 0.2, 1]],
  [[250, 1, 0.2], [1450, -0.6, -0.8], [2700, -1, 0.4]],
  [[100, 0.4, -1], [1300, -1, 0.1], [2550, 0.9, 0.6]],
];
const dartAnims = dartSets.map((darts, n) => {
  const len = 4000;
  const track = (axis) => {
    const keys = [{ frame: 0, value: 0 }];
    let prev = 0;
    for (const [at, x, y] of darts) {
      const v = (axis === 'x' ? x : y) * D.px;
      keys.push({ frame: at, value: prev, ease: D.ease }, { frame: at + D.moveMs, value: v });
      prev = v;
    }
    keys.push({ frame: len - 200, value: prev, ease: D.ease }, { frame: len - 100, value: 0 }, { frame: len, value: 0 });
    return keys;
  };
  return anim(`darts_${n}`, len, ['L', 'R'].flatMap((s) => [{ name: `pupil_${s}_dart`, property: 'x', keys: track('x') }, { name: `pupil_${s}_dart`, property: 'y', keys: track('y') }]));
});
const dartStill = anim('darts_still', 100, ['L', 'R'].flatMap((s) => [{ name: `pupil_${s}_dart`, property: 'x', value: 0 }, { name: `pupil_${s}_dart`, property: 'y', value: 0 }]));

// ---- Blink (layer 4): waits of 2.5 to 5.5 s, one in three a double ----
const blinkParts = ['lid_upper_L', 'lid_upper_R', 'lash_flick_L', 'lash_flick_R'].map((p) => `${p}_blink`);
const blinkKeys = (keys) => blinkParts.map((name) => ({ name, property: 'strength', keys }));
const blinkSingle = anim('blink', blinkLen, blinkKeys(blinkCurve()));
const blinkDouble = anim('blink_double', 2 * blinkLen + 60, blinkKeys([...blinkCurve(0), ...blinkCurve(blinkLen + 60)]));
const blinkWaits = b.waitsMs.map((ms) => anim(`blink_wait_${ms}`, ms, blinkKeys([{ frame: 0, value: 0 }])));

// ---- Mouth and jaw (layer 6) ----
const mouthExpr = anim('mouth_expression', 100, [{ name: 'mouth_expr', property: 'opacity', value: 1 }, { name: 'mouth_talk', property: 'opacity', value: 0 }]);
const mouthTalk = anim('mouth_talking', 100, [{ name: 'mouth_expr', property: 'opacity', value: 0 }, { name: 'mouth_talk', property: 'opacity', value: 1 }]);
const visemeAnims = Object.fromEntries(VISEMES.map((v) => [v, anim(`viseme_${v}`, 100, VISEMES.map((w) => ({ name: `viseme_${w}`, property: 'opacity', value: w === v ? 1 : 0 })))]));

// ---- Sway demo, for the contact sheet only: the head tilted -6° with the locks at the reference's
// lag, overshoot and settle angles. Played by the Sway artboard, never by the state machine.
const swayFrames = [['still', 0, 0], ['lag', -6, 4], ['overshoot', -6, -2.5], ['settle', -6, 0]];
const swayDemo = swayFrames.map(([n, tilt, sway]) => {
  const v = clone(E.listening);
  Object.assign(v, withTurn(X.neutral, 0));
  v.head = { rot: tilt };
  v.lock_L = { rot: sway };
  v.lock_R = { rot: sway };
  return anim(`sway_${n}`, 100, [...poseKeys(v), ...armKeys()]);
});

// ---------- state machine ----------
const easeInterp = () => el('CubicEaseInterpolator', { x1: EASE[0], y1: EASE[1], x2: EASE[2], y2: EASE[3] });
const comparator = (bindable, key, prop) => el('TransitionPropertyViewModelComparator', {}, [el(bindable, {}, [el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props[prop].id}`, propertyKey: key })])]);
const enumCond = (prop, enumName, key, op = 'equal') =>
  el('TransitionViewModelCondition', { opValue: op }, [comparator('BindablePropertyEnum', 637, prop), el('TransitionValueEnumComparator', { value: VM.enums[enumName].values[key] })]);
const boolCond = (name, value) =>
  el('TransitionViewModelCondition', { opValue: 'equal' }, [comparator('BindablePropertyBoolean', 634, name), el('TransitionValueBooleanComparator', { value: value ? 'true' : 'false' })]);
const numCond = (name, op, value) =>
  el('TransitionViewModelCondition', { opValue: op }, [comparator('BindablePropertyNumber', 636, name), el('TransitionValueNumberComparator', { value })]);
const triggerCond = (name) => el('TransitionViewModelCondition', {}, [comparator('BindablePropertyTrigger', 686, name), el('TransitionValueTriggerComparator', {})]);
const transition = (to, { ms = 0, ease = false, exit = false, conds = [] } = {}) => {
  const attrs = { stateToId: to };
  if (ms) attrs.duration = ms;
  if (ease) attrs.interpolationType = 'cubic';
  if (exit) Object.assign(attrs, { enableExitTime: 'true', exitTimeIsPercetange: 'true', exitTime: 100 });
  return el('StateTransition', attrs, [...(ease ? [easeInterp()] : []), ...conds]);
};
function layer(name, build) {
  const lid = newId();
  const states = [];
  const any = el('AnyState', { x: 0, y: -160, id: newId() });
  let col = 0;
  const state = (animationId, opts = {}) => {
    const s = el('AnimationState', { animationId, x: 180 + (col % 6) * 200, y: Math.floor(col / 6) * 160 + (col % 2) * 60, id: newId(), ...(opts.random ? { random: 'true' } : {}), ...(opts.reset ? { reset: 'true' } : {}) });
    col++;
    states.push(s);
    return s;
  };
  const entry = el('EntryState', { x: 0, y: 0 });
  build({ state, any, entry });
  return el('StateMachineLayer', { name, id: lid }, [any, el('ExitState', { x: 0, y: -320 }), entry, ...states]);
}
const moodBlend = (a, b) => (a === 'thinking' || b === 'thinking' ? T.thinkingBlendMs : T.moodBlendMs);
const MOVING = ['idle', 'listening', 'thinking']; // moods with eye darts

const layers = [];
// 1. Mood: the moods, and the face part of every reaction.
layers.push(layer('1 Mood', ({ state, any, entry }) => {
  const mood = Object.fromEntries(MOODS.map((m) => [m, state(moodAnims[m], { reset: true })]));
  entry.children.push(transition(mood.idle.attrs.id));
  for (const from of MOODS) for (const to of MOODS) {
    if (from !== to) mood[from].children.push(transition(mood[to].attrs.id, { ms: moodBlend(from, to), ease: true, conds: [enumCond('mood', 'Mood', to)] }));
  }
  for (const [t, f] of Object.entries(reactFace)) {
    const s = state(f.anim, { reset: true });
    any.children.push(transition(s.attrs.id, { ms: f.inMs, ease: true, conds: [triggerCond(t)] }));
    if (f.untilTalking) s.children.push(transition(mood.talking.attrs.id, { ms: T.moodBlendMs, ease: true, conds: [enumCond('mood', 'Mood', 'talking')] }));
    for (const m of MOODS) s.children.push(transition(mood[m].attrs.id, { ms: T.reactOutMs, ease: true, exit: true, conds: [enumCond('mood', 'Mood', m)] }));
  }
}));
// 2. Talking motion, while talking (off with reduced motion). Blends in and out over 420 ms.
layers.push(layer('2 Talking motion', ({ state, entry }) => {
  const still = state(talkStill), talk = state(talkLoop);
  entry.children.push(transition(still.attrs.id));
  still.children.push(transition(talk.attrs.id, { ms: T.moodBlendMs, ease: true, conds: [enumCond('mood', 'Mood', 'talking'), boolCond('reducedMotion', false)] }));
  talk.children.push(transition(still.attrs.id, { ms: T.moodBlendMs, ease: true, conds: [enumCond('mood', 'Mood', 'talking', 'notEqual')] }));
  talk.children.push(transition(still.attrs.id, { ms: T.moodBlendMs, ease: true, conds: [boolCond('reducedMotion', true)] }));
}));
// 3. Reactions: movement and arm swaps, each starting with a blink. Reduced motion keeps the blink only.
layers.push(layer('3 Reactions', ({ state, any, entry }) => {
  const rest = state(reactRestAnim);
  entry.children.push(transition(rest.attrs.id));
  for (const t of TRIGGERS) {
    const s = state(reactions[t], { reset: true });
    s.children.push(transition(rest.attrs.id, { ms: T.reactOutMs, exit: true }));
    if (reactionsStill[t]) {
      const st = state(reactionsStill[t], { reset: true });
      st.children.push(transition(rest.attrs.id, { ms: T.reactOutMs, exit: true }));
      any.children.push(transition(s.attrs.id, { ms: T.reactInMs, conds: [triggerCond(t), boolCond('reducedMotion', false)] }));
      any.children.push(transition(st.attrs.id, { ms: T.reactInMs, conds: [triggerCond(t), boolCond('reducedMotion', true)] }));
    } else any.children.push(transition(s.attrs.id, { ms: T.reactInMs, conds: [triggerCond(t)] }));
  }
}));
// 3b. Posture: sitUp stays for the call, so it can't share the Reactions layer.
layers.push(layer('3b Posture', ({ state, entry }) => {
  const rest = state(postureRest), up = state(postureSitUp);
  entry.children.push(transition(rest.attrs.id));
  rest.children.push(transition(up.attrs.id, { ms: T.sitUp.ms, ease: true, conds: [triggerCond('sitUp')] }));
}));
// 4. Blink on its own timer.
layers.push(layer('4 Blink', ({ state, entry }) => {
  const waits = blinkWaits.map((a) => state(a, { random: true }));
  const single = state(blinkSingle, { random: true }), dbl = state(blinkDouble, { random: true });
  entry.children.push(transition(waits[3].attrs.id));
  for (const w of waits) {
    const ts = transition(single.attrs.id, { exit: true }); ts.attrs.randomWeight = b.singleWeight;
    const td = transition(dbl.attrs.id, { exit: true }); td.attrs.randomWeight = b.doubleWeight;
    w.children.push(ts, td);
  }
  for (const bl of [single, dbl]) for (const w of waits) bl.children.push(transition(w.attrs.id, { exit: true }));
}));
// 5. Eye darts while idle, listening or thinking (off with reduced motion).
layers.push(layer('5 Eye darts', ({ state, entry }) => {
  const still = state(dartStill);
  const darts = dartAnims.map((a) => state(a, { random: true, reset: true }));
  entry.children.push(transition(still.attrs.id));
  for (const m of MOVING) still.children.push(transition(darts[0].attrs.id, { ms: T.moodBlendMs, conds: [enumCond('mood', 'Mood', m), boolCond('reducedMotion', false)] }));
  for (const d of darts) {
    d.children.push(transition(still.attrs.id, { ms: 150, conds: MOVING.map((m) => enumCond('mood', 'Mood', m, 'notEqual')) }));
    d.children.push(transition(still.attrs.id, { ms: 150, conds: [boolCond('reducedMotion', true)] }));
    for (const o of darts) if (o !== d) d.children.push(transition(o.attrs.id, { exit: true }));
  }
}));
// 6a. Mouth set: visemes while talking, the expression's mouth otherwise.
layers.push(layer('6 Mouth', ({ state, entry }) => {
  const expr = state(mouthExpr), talk = state(mouthTalk);
  entry.children.push(transition(expr.attrs.id));
  expr.children.push(transition(talk.attrs.id, { ms: T.mouthFadeMs, conds: [enumCond('mood', 'Mood', 'talking')] }));
  talk.children.push(transition(expr.attrs.id, { ms: T.mouthFadeMs, conds: [enumCond('mood', 'Mood', 'talking', 'notEqual')] }));
}));
// 6b. Viseme: letter timing picks the shape; without it, mouthOpen picks rest, teeth or open.
layers.push(layer('6b Viseme', ({ state, entry }) => {
  const vs = Object.fromEntries(VISEMES.map((v) => [v, state(visemeAnims[v])]));
  const [lo, hi] = T.fallbackBands;
  const bands = {
    rest: [numCond('mouthOpen', 'lessThan', lo)],
    teeth: [numCond('mouthOpen', 'greaterThanOrEqual', lo), numCond('mouthOpen', 'lessThan', hi)],
    open: [numCond('mouthOpen', 'greaterThanOrEqual', hi)],
  };
  const auto = Object.fromEntries(Object.keys(bands).map((v) => [v, state(visemeAnims[v])]));
  entry.children.push(transition(vs.rest.attrs.id));
  for (const from of [...Object.values(vs), ...Object.values(auto)]) {
    for (const to of VISEMES) if (from !== vs[to]) from.children.push(transition(vs[to].attrs.id, { ms: T.mouthFadeMs, conds: [boolCond('lipSync', true), enumCond('viseme', 'Viseme', to)] }));
    for (const [band, conds] of Object.entries(bands)) if (from !== auto[band]) from.children.push(transition(auto[band].attrs.id, { ms: T.mouthFadeMs, conds: [boolCond('lipSync', false), ...conds] }));
  }
}));
// 7. Breathing and follow-through (off with reduced motion).
layers.push(layer('7 Breathing', ({ state, entry }) => {
  const breathe = state(breathLoop), still = state(breathStill);
  entry.children.push(transition(breathe.attrs.id));
  breathe.children.push(transition(still.attrs.id, { ms: T.moodBlendMs, ease: true, conds: [boolCond('reducedMotion', true)] }));
  still.children.push(transition(breathe.attrs.id, { ms: T.moodBlendMs, ease: true, conds: [boolCond('reducedMotion', false)] }));
}));

const smId = newId();
const stateMachine = el('StateMachine', { name: 'InterviewVM', id: smId }, layers);

// ---------- the file ----------
const arg = (flag) => { const i = process.argv.indexOf(flag); return i > 0 ? process.argv[i + 1] : undefined; };
const outFile = arg('--out') ? path.resolve(arg('--out')) : path.join(ROOT, 'meera.rml');
const W = X.artboard.width, H = X.artboard.height;
const styleId = newId();
const meeraId = newId();
const artboard = el('Artboard', { defaultStateMachineId: smId, viewModelId: VM.id, viewModelInstanceId: VM.instanceId, styleId, isComponent: 'true', clip: 'true', width: W, height: H, name: 'Meera', id: meeraId }, [
  el('LayoutComponentStyle', { name: 'Artboard Style', id: styleId }),
  ...sceneRoot.children,
  stateMachine,
  ...animations,
]);
// The Sway artboard: four nested Meeras, each holding one sway demo pose. Contact sheet only.
const swayStyle = newId(), swaySm = newId(), swayIdleAnim = newId(), swayIdleState = newId();
const swayArtboard = el('Artboard', { defaultStateMachineId: swaySm, styleId: swayStyle, width: W * 4, height: H, x: W + 80, y: 0, name: 'Sway', id: newId() }, [
  el('LayoutComponentStyle', { name: 'Sway Style', id: swayStyle }),
  ...swayDemo.map((a, i) => el('NestedArtboard', { artboardId: meeraId, x: i * W, y: 0, name: `sway ${swayFrames[i][0]}` }, [el('NestedRemapAnimation', { animationId: a, time: 0, name: 'Pose' })])),
  el('StateMachine', { name: 'Sway', id: swaySm }, [
    el('StateMachineLayer', { name: 'Hold', id: newId() }, [
      el('AnyState', { x: 0, y: -160 }),
      el('ExitState', { x: 0, y: -320 }),
      el('EntryState', { x: 0, y: 0 }, [el('StateTransition', { stateToId: swayIdleState })]),
      el('AnimationState', { animationId: swayIdleAnim, x: 180, y: 0, id: swayIdleState }),
    ]),
  ]),
  el('LinearAnimation', { duration: 10, name: 'Idle', id: swayIdleAnim }),
]);

const doc = el('Rive', { version: 1, kind: 'fragment' }, [artboard, swayArtboard, el('ComponentAsset', { artboardId: meeraId, name: 'Meera' }), ...enums, ...converters, viewModel()]);
const header = '<!-- Generated by rive/rig/make-rig.js from parts/meera-parts.svg and expressions.json. Do not edit by hand. -->\n';
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, header + serialize(doc) + '\n');
console.log(`${path.relative(process.cwd(), outFile)}: ${Object.keys(reg).length} rig parts, ${animations.length} animations, ${layers.length} layers`);
